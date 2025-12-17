<script setup>
import { ref, onMounted } from 'vue';
import { BookOpen, User, PlusCircle, Trash2, GraduationCap, MinusCircle, Edit2, X } from 'lucide-vue-next';
import { auth } from '../firebase/firebase';
import { useCourses } from '../composables/useCourses';

const { 
    courses, 
    isLoading, 
    loadCourses, 
    addCourseEntry, 
    updateCourseProgress, 
    updateCourseDetails, 
    removeCourse 
} = useCourses();

const newCourse = ref({ 
  name: '', 
  totalChapters: 10, 
  teacher: '' 
});
const editingCourse = ref(null); 

const handleAddCourse = async () => {
  if (newCourse.value.name) {
      await addCourseEntry(newCourse.value.name, newCourse.value.totalChapters, newCourse.value.teacher);
      newCourse.value = { name: '', totalChapters: 10, teacher: '' };
  }
};

const openEditModal = (course) => {
    editingCourse.value = { ...course };
};

const closeEditModal = () => {
    editingCourse.value = null;
};

const saveEdit = async () => {
    if(!editingCourse.value) return;
    
    await updateCourseDetails(editingCourse.value.id, {
        name: editingCourse.value.name,
        totalChapters: parseInt(editingCourse.value.totalChapters),
        teacher: editingCourse.value.teacher
    });
    
    closeEditModal();
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
    <div class="header-section">
      <h1><BookOpen size="28" style="color:var(--primary); vertical-align:bottom; margin-right:8px;"/> Gestion des Cours</h1>
      <p>Ajoute tes matières pour centraliser ta progression.</p>
    </div>
    
    <!-- Quick Add Bar -->
    <div class="card quick-add-bar">
        <form @submit.prevent="handleAddCourse" class="inline-form">
            <div class="input-group">
                <BookOpen size="18" class="input-icon-inline" />
                <input v-model="newCourse.name" placeholder="Matière (ex: Maths)" required class="clean-input" />
            </div>

            <div class="input-group">
                <User size="18" class="input-icon-inline" /> <!-- Icone User importée -->
                <input v-model="newCourse.teacher" placeholder="Professeur (ex: M. Dupont)" class="clean-input" />
            </div>
            
            <div class="input-group small">
                <GraduationCap size="18" class="input-icon-inline" />
                <input type="number" v-model="newCourse.totalChapters" min="1" placeholder="Nb Chapitres" required class="clean-input" />
            </div>

            <button type="submit" class="primary btn-add">
                <PlusCircle size="18" /> <span class="desktop-only">Ajouter</span>
            </button>
        </form>
    </div>

    <!-- Course List Grid -->
    <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div> Chargement...
    </div>

    <div v-else class="courses-grid-container">
        <div v-if="courses.length === 0" class="empty-box full-width">
            <GraduationCap size="48" class="empty-icon" />
            <div class="empty-text">Aucun cours</div>
            <div class="empty-sub">Utilise la barre ci-dessus pour ajouter tes matières rapidement.</div>
        </div>
        
        <div v-for="course in courses" :key="course.id" class="card course-card">
            <div class="card-top">
                <div class="course-info">
                   <h3>{{ course.name }}</h3>
                   <p v-if="course.teacher" class="prof">Prof. {{ course.teacher }}</p>
                </div>
                <!-- ... existing card actions ... -->
                <div class="card-actions">
                    <button @click="openEditModal(course)" class="icon-btn edit" title="Modifier">
                        <Edit2 size="18" />
                    </button>
                    <button @click="removeCourse(course.id)" class="icon-btn delete" title="Supprimer">
                        <Trash2 size="18" />
                    </button>
                </div>
            </div>
               
             <div class="stats-row">
                <span class="progress-text">
                  <span class="bold">{{ course.completedChapters }}</span> / {{ course.totalChapters }}
                </span>
                <span class="percent">
                  {{ Math.round((course.completedChapters / course.totalChapters) * 100) }}%
                </span>
             </div>
              
             <div class="progress-bar-container">
               <div class="progress-bar">
                 <div class="progress-fill" :style="{ width: (course.completedChapters / course.totalChapters * 100) + '%' }"></div>
               </div>
             </div>
              
             <div class="actions-row">
                 <button @click="updateCourseProgress(course, -1)" class="action-btn outline" :disabled="course.completedChapters <= 0">
                   <MinusCircle size="20" />
                 </button>
                 <button @click="updateCourseProgress(course, 1)" class="action-btn primary" :disabled="course.completedChapters >= course.totalChapters">
                   <PlusCircle size="20" />
                 </button>
             </div>
        </div>
    </div>

    <!-- Edit Modal Overlay -->
    <div v-if="editingCourse" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Modifier le cours</h3>
                <button @click="closeEditModal" class="close-btn"><X size="20" /></button>
            </div>
            <form @submit.prevent="saveEdit">
                <label>Nom du cours</label>
                <input v-model="editingCourse.name" required />
                
                <label>Nombre total de chapitres</label>
                <input type="number" v-model="editingCourse.totalChapters" min="1" required />
                
                <label>Professeur</label>
                <input v-model="editingCourse.teacher" />

                <div class="modal-actions">
                    <button type="button" @click="closeEditModal" class="btn secondary">Annuler</button>
                    <button type="submit" class="btn primary">Enregistrer</button>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* Reusing shared styles - keeping them here as View-specific */
.header-section {
    text-align: center;
    margin-bottom: 2.5rem;
}
.header-section h1 {
    margin-bottom: 0.5rem;
    font-size: 2rem;
}
.header-section p {
    color: var(--text-light);
}

.h-fit { height: fit-content; }

.add-card {
    border: 1px solid var(--border-color);
    position: sticky;
    top: 100px;
}
.add-card h2 { font-size: 1.25rem; margin-bottom: 1.5rem; }

.input-with-icon {
  position: relative;
  margin-bottom: 1.25rem;
}
.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
}
.input-with-icon input {
  padding-left: 42px;
  margin-bottom: 0;
}

.course-card {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}
.course-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.course-info h3 {
    font-size: 1.1rem;
    margin-bottom: 0.2rem;
    color: var(--text-dark);
}
.prof {
  color: var(--text-light);
  font-size: 0.9rem;
}

.card-actions {
    display: flex;
    gap: 0.5rem;
}

.icon-btn {
  background: transparent;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}
.icon-btn.delete { color: #1e293b; } /* Dark/Black for visibility */
.icon-btn.delete:hover { color: #EF4444; background: #FEF2F2; }
.icon-btn.edit { color: #1e293b; } /* Dark/Black for visibility */
.icon-btn.edit:hover { color: var(--primary); background: #EFF6FF; }


.stats-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: var(--text-light);
}
.stats-row .bold {
    color: var(--text-dark);
    font-weight: 700;
}
.percent {
  color: var(--primary);
  font-weight: 700;
}

.progress-bar {
    height: 10px;
    background: #F1F5F9;
    border-radius: 100px;
}
.progress-fill {
    height: 100%;
    border-radius: 100px;
    background: var(--primary);
    transition: width 0.3s ease;
}

.actions-row {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}
.action-btn {
  flex: 1;
  padding: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:active { transform: scale(0.95); }

.action-btn.outline {
  background: #F8FAFC;
  border: 1px solid var(--border-color);
  color: var(--text-light);
}
.action-btn.outline:hover {
    background: #F1F5F9;
    color: var(--text-dark);
}
.action-btn.primary {
  background: #EFF6FF;
  color: var(--primary);
  border: 1px solid #DBEAFE;
}
.action-btn.primary:hover {
    background: var(--primary);
    color: white;
}
.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-light);
}
.spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #E2E8F0;
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
}
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

/* Inline Quick Add */
.quick-add-bar {
    padding: 1rem;
    margin-bottom: 2rem;
    background: var(--surface);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border-color);
    box-shadow: var(--glass-shadow);
    border-radius: 99px; /* Pill shape for the bar */
    display: flex;
    align-items: center;
}

.inline-form {
    display: flex;
    gap: 1rem;
    width: 100%;
    align-items: center;
}

.input-group {
    position: relative;
    flex: 1;
}

.input-group.small {
    flex: 0 0 150px;
}

.clean-input {
    width: 100%;
    border: none;
    background: transparent;
    padding: 0.8rem 1rem 0.8rem 2.5rem;
    font-size: 1rem;
    border-radius: 99px; /* Inner roundness */
    background: var(--input-bg);
    color: var(--text-dark);
    transition: background 0.2s, color 0.2s;
    border: 1px solid transparent; /* Prevent jump on focus if needed, or matched border */
}

.clean-input:focus {
    background: var(--surface-hover);
    outline: none;
    border-color: var(--primary);
}

.input-icon-inline {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-dark); /* Auto-switches: Slate in Light, White in Dark */
    pointer-events: none;
    opacity: 0.7;
}

.btn-add {
    border-radius: 99px;
    padding: 0.8rem 1.5rem;
    flex-shrink: 0;
}

/* Grid Layout */
.courses-grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.course-card {
    margin-bottom: 0; /* Override */
    border-radius: 24px;
}

@media (max-width: 768px) {
    .inline-form {
        flex-direction: column;
        gap: 0.8rem;
    }
    .input-group, .input-group.small, .btn-add {
        width: 100%;
        flex: none;
    }
    .quick-add-bar {
        border-radius: 24px; /* Less pill-like on mobile */
        padding: 1.5rem;
    }
    .desktop-only { display: inline; } /* Keep text on mobile for clarity */
}

/* Modal updates */
.modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
}
.btn {
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    flex: 1;
}
.btn.primary { background: var(--primary); color: white; }
.btn.secondary { background: #F1F5F9; color: var(--text-dark); }
</style>
