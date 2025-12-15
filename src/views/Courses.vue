<script setup>
import { ref, onMounted } from 'vue';
import { BookOpen, User, PlusCircle, Trash2, GraduationCap, MinusCircle } from 'lucide-vue-next';
import { db, auth } from '../firebase/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query } from 'firebase/firestore'; 

const courses = ref([]);
const newCourse = ref({ 
  name: '', 
  totalChapters: 10, 
  teacher: '' 
});
const isLoading = ref(true);

// Helper to get collection ref for current user
const getCoursesCollection = () => {
    const user = auth.currentUser;
    if (!user) return null;
    return collection(db, 'users', user.uid, 'courses');
};

const loadCourses = async () => {
  const colRef = getCoursesCollection();
  if (!colRef) return;
  
  isLoading.value = true;
  try {
      const q = query(colRef);
      const snapshot = await getDocs(q);
      courses.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));
  } catch (e) {
      console.error("Error loading courses:", e);
  } finally {
      isLoading.value = false;
  }
};

const addCourse = async () => {
  if (newCourse.value.name) {
    const colRef = getCoursesCollection();
    if (!colRef) return;

    const courseData = {
      name: newCourse.value.name,
      totalChapters: parseInt(newCourse.value.totalChapters),
      completedChapters: 0,
      teacher: newCourse.value.teacher || null,
      createdAt: new Date()
    };
    
    try {
        const docRef = await addDoc(colRef, courseData);
        courses.value.push({ id: docRef.id, ...courseData });
        newCourse.value = { name: '', totalChapters: 10, teacher: '' };
    } catch (e) {
        console.error("Error adding course:", e);
    }
  }
};

const updateProgress = async (course, amount) => {
  const newVal = course.completedChapters + amount;
  if (newVal >= 0 && newVal <= course.totalChapters) {
    // Optimistic
    const oldVal = course.completedChapters;
    course.completedChapters = newVal;

    const colRef = getCoursesCollection();
    if(colRef) {
        try {
            await updateDoc(doc(colRef, course.id), { completedChapters: newVal });
        } catch (e) {
            console.error("Error updating progress:", e);
            course.completedChapters = oldVal;
        }
    }
  }
};

const deleteCourse = async (id) => {
  if(confirm('Supprimer ce cours ?')) {
    const oldList = [...courses.value];
    courses.value = courses.value.filter(c => c.id !== id);

    const colRef = getCoursesCollection();
    if(colRef) {
        try {
            await deleteDoc(doc(colRef, id));
        } catch (e) {
             console.error("Error deleting course:", e);
             courses.value = oldList;
        }
    }
  }
};

onMounted(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
            loadCourses();
        } else {
            isLoading.value = false;
            courses.value = [];
        }
    });
});
</script>

<template>
  <div class="container">
    <div class="header-section" style="margin-bottom:2rem;">
      <h1>Gestion des Cours</h1>
      <p style="color:var(--text-light);">Ajoute tes matières pour suivre ta progression.</p>
    </div>
    
    <div class="grid-2">
      <!-- Formulaire d'ajout -->
      <div class="card h-fit">
        <h2><PlusCircle size="20" style="vertical-align:bottom; color:var(--primary); margin-right:5px;"/> Ajouter un cours</h2>
        <form @submit.prevent="addCourse">
          <label>Nom du cours</label>
          <div class="input-with-icon">
            <BookOpen size="16" class="input-icon" />
            <input v-model="newCourse.name" placeholder="Ex: Mathématiques" required />
          </div>
          
          <label>Nombre de chapitres</label>
          <input type="number" v-model="newCourse.totalChapters" min="1" required />
          
          <label>Professeur (Optionnel)</label>
          <div class="input-with-icon">
             <User size="16" class="input-icon" />
             <input v-model="newCourse.teacher" placeholder="Ex: M. Dupont" />
          </div>
          
          <button type="submit" class="primary full-width">Ajouter le cours</button>
        </form>
      </div>

      <!-- Liste des cours -->
      <div v-if="isLoading" class="loading-state">
          Chargement...
      </div>
      <div v-else>
        <div v-if="courses.length === 0" class="empty-box">
          <GraduationCap size="48" class="empty-icon" />
          <div class="empty-text">Aucun cours pour le moment</div>
          <div class="empty-sub">Utilise le formulaire pour ajouter tes matières.</div>
        </div>
        
        <div v-for="course in courses" :key="course.id" class="card course-card">
          <div class="card-top">
             <div class="course-info">
              <h3 class="flex-center"><BookOpen size="18" style="margin-right:6px; color:var(--primary);"/> {{ course.name }}</h3>
              <p v-if="course.teacher" class="prof">Prof. {{ course.teacher }}</p>
            </div>
            <button @click="deleteCourse(course.id)" class="delete-btn" title="Supprimer">
              <Trash2 size="18" />
            </button>
          </div>
          
          <div class="stats-row">
            <span class="progress-text">
              {{ course.completedChapters }} / {{ course.totalChapters }} chapitres
            </span>
            <span class="percent">
              {{ Math.round((course.completedChapters / course.totalChapters) * 100) }}%
            </span>
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: (course.completedChapters / course.totalChapters * 100) + '%' }">
              </div>
            </div>
          </div>
          
          <div class="actions-row">
             <button @click="updateProgress(course, -1)" class="action-btn outline" :disabled="course.completedChapters <= 0">
               <MinusCircle size="18" />
             </button>
             <button @click="updateProgress(course, 1)" class="action-btn primary" :disabled="course.completedChapters >= course.totalChapters">
               <PlusCircle size="18" />
             </button>
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
}
.input-with-icon input {
  padding-left: 36px;
}
.course-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s;
  position: relative;
}
.course-card:hover {
  transform: translateY(-2px);
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.flex-center {
  display: flex;
  align-items: center;
}
.delete-btn {
  background: transparent;
  color: #ccc;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}
.delete-btn:hover {
  color: #e74c3c;
  background: #fff5f5;
}
.prof {
  color: var(--text-light);
  font-size: 0.9rem;
  margin-top: 0.2rem;
  margin-left: 24px; /* Align with text */
}
.stats-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-dark);
}
.percent {
  color: var(--primary);
  font-weight: 700;
}
.actions-row {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}
.action-btn {
  flex: 1;
  padding: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-btn.outline {
  background: transparent;
  border: 1px solid #E0E0E0;
  color: var(--text-dark);
}
.action-btn.outline:hover {
  background: #f9f9f9;
  border-color: #d0d0d0;
}
.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.progress-bar-container {
  width: 100%;
}
.loading-state {
    text-align: center;
    padding: 2rem;
    color: var(--text-light);
    font-size: 1.1rem;
}
</style>
