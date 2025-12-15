<script setup>
import { ref, onMounted } from 'vue';
import { Calendar, Trash2, BookOpen, Clock, PlayCircle } from 'lucide-vue-next';
import { db, auth } from '../firebase/firebase';
import { collection, addDoc, getDocs, doc, query, writeBatch, where } from 'firebase/firestore'; 

const courses = ref([]);
const planning = ref([]);
const form = ref({
  courseId: '',
  examDate: '',
  chaptersCount: 1,
  dailyHours: 2
});
const isLoading = ref(true);

const getCollectionRef = (collName) => {
    const user = auth.currentUser;
    if (!user) return null;
    return collection(db, 'users', user.uid, collName);
};

const loadData = async () => {
  const user = auth.currentUser;
  if (!user) return;
  
  isLoading.value = true;
  try {
      // 1. Load Courses (to select from)
      const coursesRef = getCollectionRef('courses');
      const coursesSnap = await getDocs(coursesRef);
      courses.value = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Load Planning
      const planningRef = getCollectionRef('planning');
      const planningSnap = await getDocs(planningRef);
      planning.value = planningSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort by date
      planning.value.sort((a, b) => new Date(a.day) - new Date(b.day));
  } catch(e) {
      console.error("Error loading data:", e);
  } finally {
      isLoading.value = false;
  }
};

const formatDate = (dateStr) => {
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  return new Date(dateStr).toLocaleDateString('fr-FR', options);
};

// Group by day for display
const groupedPlanning = () => {
  const groups = {};
  planning.value.forEach(item => {
    if (!groups[item.day]) groups[item.day] = [];
    groups[item.day].push(item);
  });
  return Object.keys(groups).sort().map(date => ({
    date,
    items: groups[date]
  }));
};

const generatePlanning = async () => {
  if (!form.value.courseId || !form.value.examDate) return;

  const course = courses.value.find(c => c.id === form.value.courseId);
  if (!course) return;

  const start = new Date();
  const end = new Date(form.value.examDate);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    alert("La date de l'examen doit être dans le futur !");
    return;
  }

  // 1. Prepare new tasks
  const newTasks = [];
  const chaptersToRevise = parseInt(form.value.chaptersCount);
  
  for (let i = 0; i < chaptersToRevise; i++) {
    const dayIndex = Math.floor( (i / chaptersToRevise) * diffDays );
    const taskDate = new Date(start);
    taskDate.setDate(start.getDate() + dayIndex + 1); 
    const dateStr = taskDate.toLocaleDateString('sv');
    
    newTasks.push({
      day: dateStr,
      task: `Chapitre ${i + 1}`, 
      courseName: course.name,
      courseId: course.id 
    });
  }

  // 2. Batch Write: Delete old tasks for this course & Add new ones
  const planningRef = getCollectionRef('planning');
  if(!planningRef) return;
  const batch = writeBatch(db);

  // Find existing tasks for this course to delete
  // Note: Client-side filtering because we loaded everything, but ideally usage of query()
  // Just to be safe and simple: delete all remote docs for this courseId?
  // We need their IDs. The local 'planning' has them.
  const tasksToDelete = planning.value.filter(p => p.courseId === course.id);
  
  tasksToDelete.forEach(task => {
      batch.delete(doc(db, 'users', auth.currentUser.uid, 'planning', task.id));
  });

  // Add new tasks
  newTasks.forEach(task => {
      const newDocRef = doc(planningRef); // Generate ID
      batch.set(newDocRef, task);
  });

  try {
      await batch.commit();
      await loadData(); // Reload to sync
      form.value.chaptersCount = 1;
  } catch(e) {
      console.error("Error generating planning:", e);
  }
};

const clearAll = async () => {
  if(confirm('Tout effacer ?')) {
    const batch = writeBatch(db);
    const planningRef = getCollectionRef('planning');
    if(!planningRef) return;

    planning.value.forEach(item => {
        batch.delete(doc(db, 'users', auth.currentUser.uid, 'planning', item.id));
    });

    try {
        await batch.commit();
        planning.value = [];
    } catch(e) {
        console.error("Error clearing planning:", e);
    }
  }
};

onMounted(() => {
     const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
            loadData();
        } else {
            isLoading.value = false;
            courses.value = [];
            planning.value = [];
        }
    });
});
</script>

<template>
  <div class="container">
    <div class="header-section" style="margin-bottom:2rem;">
      <h1>Planning Automatique</h1>
      <p style="color:var(--text-light);">Génère ton programme de révision en 2 secondes.</p>
    </div>
    
    <div class="grid-2">
      <!-- Formulaire -->
      <div class="card h-fit">
        <h2><PlayCircle size="20" style="vertical-align:bottom; color:var(--primary); margin-right:5px;"/> Nouveau Cycle</h2>
        <form @submit.prevent="generatePlanning">
          <label>Cours</label>
          <div class="input-with-icon">
             <BookOpen size="16" class="input-icon" />
             <select v-model="form.courseId" required>
                <option disabled value="">Choisir un cours</option>
                <option v-for="course in courses" :key="course.id" :value="course.id">
                  {{ course.name }}
                </option>
             </select>
          </div>
          
          <label>Date de l'examen</label>
          <div class="input-with-icon">
            <Calendar size="16" class="input-icon" />
            <input type="date" v-model="form.examDate" required />
          </div>
          
          <label>Chapitres à réviser</label>
          <input type="number" v-model="form.chaptersCount" min="1" required />
          
          <label>Temps dispo / jour (heures)</label>
          <div class="input-with-icon">
            <Clock size="16" class="input-icon" />
            <input type="number" v-model="form.dailyHours" min="1" />
          </div>
          
          <button type="submit" class="primary full-width">Générer le planning</button>
        </form>
      </div>

      <!-- Resultat -->
      <div class="planning-display">
        <div class="header-row">
          <h2>Votre Planning</h2>
          <button @click="clearAll" v-if="planning.length > 0" class="clear-btn">
            <Trash2 size="16" style="margin-right:4px;" /> Tout effacer
          </button>
        </div>

        <div v-if="isLoading" style="color:var(--text-light); font-style:italic;">Chargement...</div>
        
        <div v-else>
            <div v-if="planning.length === 0" class="empty-box">
            <Calendar size="48" class="empty-icon" />
            <div class="empty-text">Ton planning est vide</div>
            <div class="empty-sub">Remplis le formulaire pour générer tes révisions.</div>
            </div>
            
            <div v-for="group in groupedPlanning()" :key="group.date" class="day-group">
            <div class="day-header">{{ formatDate(group.date) }}</div>
            <div class="day-tasks">
                <div v-for="(item, idx) in group.items" :key="idx" class="task-card">
                <span class="badg">{{ item.courseName }}</span>
                <span class="task-name">{{ item.task }}</span>
                </div>
            </div>
            </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<style scoped>
.h-fit {
  height: fit-content;
}
.full-width {
  width: 100%;
}
.input-with-icon {
  position: relative;
}
.input-icon {
  position: absolute;
  left: 12px;
  top: 14px;
  color: #95a5a6;
  pointer-events: none;
}
.input-with-icon input, .input-with-icon select {
  padding-left: 36px;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.clear-btn {
  background: transparent;
  color: #e74c3c;
  padding: 0.5rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: all 0.2s;
}
.clear-btn:hover {
  background: #fff5f5;
}
.planning-display {
  padding-left: 1rem;
}
/* Mobile tweak for planning display padding */
@media (max-width: 768px) {
  .planning-display {
    padding-left: 0;
    margin-top: 2rem;
  }
}
.day-group {
  margin-bottom: 1.5rem;
}
.day-header {
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 0.8rem;
  font-size: 1.1rem;
  border-left: 4px solid var(--primary);
  padding-left: 0.8rem;
  text-transform: capitalize;
}
.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.task-card {
  background: var(--white);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  border: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.badg {
  font-size: 0.75rem;
  background: #F4F7FC;
  color: var(--text-light);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-weight: 600;
}
.task-name {
  font-weight: 500;
}

@media (max-width: 500px) {
  .task-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
