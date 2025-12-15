<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { Calendar, Trash2, BookOpen, Clock, PlayCircle, List, LayoutGrid } from 'lucide-vue-next';
import { db, auth } from '../firebase/firebase';
import { collection, addDoc, getDocs, doc, query, writeBatch, where } from 'firebase/firestore'; 
// FullCalendar Imports
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
// Note: timeGridPlugin is not usually needed for tasks unless we have hours, but dayGrid is fine.

const courses = ref([]);
const planning = ref([]);
const viewMode = ref('list'); // 'list' | 'calendar'
const form = ref({
  courseId: '',
  examDate: '',
  chaptersCount: 1,
  dailyHours: 2
});
const isLoading = ref(true);

// Calendar Options
const calendarOptions = ref({
    plugins: [ dayGridPlugin, interactionPlugin ],
    initialView: 'dayGridMonth',
    locale: 'fr',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek'
    },
    buttonText: {
        today: "Aujourd'hui",
        month: "Mois",
        week: "Semaine"
    },
    events: [], // Will be populated
    eventClick: (info) => {
        alert('Tache : ' + info.event.title + '\nCours : ' + info.event.extendedProps.courseName);
    },
    height: 'auto'
});

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
      // 1. Load Courses
      const coursesRef = getCollectionRef('courses');
      const coursesSnap = await getDocs(coursesRef);
      courses.value = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Load Planning
      const planningRef = getCollectionRef('planning');
      const planningSnap = await getDocs(planningRef);
      planning.value = planningSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort
      planning.value.sort((a, b) => new Date(a.day) - new Date(b.day));
      
      // Update Calendar Events
      updateCalendarEvents();

  } catch(e) {
      console.error("Error loading data:", e);
  } finally {
      isLoading.value = false;
  }
};

const updateCalendarEvents = () => {
    calendarOptions.value.events = planning.value.map(item => ({
        title: item.task,
        date: item.day, // Format YYYY-MM-DD matches
        extendedProps: {
            courseName: item.courseName,
            courseId: item.courseId
        },
        // Color based on course hash or similar? For now generic
        backgroundColor: 'var(--primary)',
        borderColor: 'var(--primary)'
    }));
};

const formatDate = (dateStr) => {
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  return new Date(dateStr).toLocaleDateString('fr-FR', options);
};

// Group by day for display (List View)
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
    const dateStr = taskDate.toLocaleDateString('sv'); // ISO format YYYY-MM-DD
    
    newTasks.push({
      day: dateStr,
      task: `Chapitre ${i + 1}`, 
      courseName: course.name,
      courseId: course.id 
    });
  }

  // 2. Batch Write
  const planningRef = getCollectionRef('planning');
  if(!planningRef) return;
  const batch = writeBatch(db);

  const tasksToDelete = planning.value.filter(p => p.courseId === course.id);
  
  tasksToDelete.forEach(task => {
      batch.delete(doc(db, 'users', auth.currentUser.uid, 'planning', task.id));
  });

  newTasks.forEach(task => {
      const newDocRef = doc(planningRef);
      batch.set(newDocRef, task);
  });

  try {
      await batch.commit();
      await loadData();
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
        updateCalendarEvents();
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
          <div class="actions">
             <button class="icon-toggle" @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }"><List size="18"/></button>
             <button class="icon-toggle" @click="viewMode = 'calendar'" :class="{ active: viewMode === 'calendar' }"><LayoutGrid size="18"/></button>
             
             <button @click="clearAll" v-if="planning.length > 0" class="clear-btn ml-2">
                <Trash2 size="16" />
             </button>
          </div>
        </div>

        <div v-if="isLoading" style="color:var(--text-light); font-style:italic;">Chargement...</div>
        
        <div v-else>
            <div v-if="planning.length === 0" class="empty-box">
                <Calendar size="48" class="empty-icon" />
                <div class="empty-text">Ton planning est vide</div>
                <div class="empty-sub">Remplis le formulaire pour générer tes révisions.</div>
            </div>
            
            <!-- LIST MODE -->
            <div v-if="viewMode === 'list'">
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

            <!-- CALENDAR MODE -->
            <div v-if="viewMode === 'calendar'" class="calendar-wrapper">
                 <FullCalendar :options="calendarOptions" />
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
.actions {
    display: flex;
    align-items: center;
    gap: 8px;
}
.icon-toggle {
    background: var(--surface);
    border: 1px solid var(--border-color);
    padding: 0.4rem;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-light);
    display: flex;
    align-items: center;
}
.icon-toggle.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
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
  border: none; 
  cursor: pointer;
}
.clear-btn:hover {
  background: #fff5f5;
}
.ml-2 { margin-left: 0.5rem; }

.planning-display {
  padding-left: 1rem;
  /* Make sure calendar takes space */
  flex: 1; 
  min-width: 0; /* Fix flex overflow */
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
  background: var(--surface); 
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  border: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.badg {
  font-size: 0.75rem;
  background: var(--bg-color);
  color: var(--text-light);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-weight: 600;
}
.task-name {
  font-weight: 500;
  color: var(--text-dark);
}

.calendar-wrapper {
    background: var(--surface);
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid var(--border-color);
}

/* FullCalendar Overrides for Theme */
:deep(.fc) {
    font-family: 'Outfit', sans-serif;
}
:deep(.fc-toolbar-title) {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-dark);
}
:deep(.fc-button) {
    background: var(--primary);
    border: none;
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: capitalize;
}
:deep(.fc-button-active) {
    background: var(--primary-hover) !important;
}
:deep(.fc-daygrid-day-number) {
    color: var(--text-dark);
    text-decoration: none;
}
:deep(.fc-col-header-cell-cushion) {
    color: var(--text-light);
    font-weight: 600;
    text-decoration: none;
}
</style>
