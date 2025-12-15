<script setup>
import { ref, onMounted } from 'vue';
import { BookOpen, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-vue-next';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore'; 

const courses = ref([]);
const deadlines = ref([]); 
const todaysTasks = ref([]);
const userFirstName = ref('');
const isLoading = ref(true);

const getLocalToday = () => new Date().toLocaleDateString('sv');

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const options = { day: 'numeric', month: 'short' };
  return new Date(dateStr).toLocaleDateString('fr-FR', options);
};

const loadDashboardData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Set user name
    userFirstName.value = user.displayName ? user.displayName.split(' ')[0] : 'Étudiant';
    
    isLoading.value = true;
    try {
        // 1. Load Courses for stats
        const coursesRef = collection(db, 'users', user.uid, 'courses');
        const coursesSnap = await getDocs(coursesRef);
        
        courses.value = coursesSnap.docs.map(doc => {
            const c = doc.data();
            return {
                id: doc.id,
                ...c,
                progress: c.totalChapters > 0 ? Math.round((c.completedChapters / c.totalChapters) * 100) : 0
            };
        });

        // 2. Load Todays Tasks
        // Optimized query: get only tasks where day == today
        const todayStr = getLocalToday();
        const planningRef = collection(db, 'users', user.uid, 'planning');
        
        // Firestore query (requires index potentially, or client side filter if small data)
        // Let's do client side filter for MVP simplicity to avoid complex compound index setups immediately
        const planningSnap = await getDocs(planningRef);
        const allPlanning = planningSnap.docs.map(d => d.data());
        
        todaysTasks.value = allPlanning.filter(p => p.day === todayStr);

        // 3. Derive Deadlines
        const sortedDates = [...new Set(allPlanning.map(p => p.day))].sort();
        const futureDates = sortedDates.filter(d => d >= todayStr).slice(0, 3);
        
        deadlines.value = futureDates.map(date => {
            const count = allPlanning.filter(p => p.day === date).length;
            return {
                date: date,
                label: `${count} tâches révision`
            };
        });

    } catch (e) {
        console.error("Error loading dashboard:", e);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
            loadDashboardData();
        } else {
            isLoading.value = false;
        }
    });
});
</script>

<template>
  <div class="container">
    <div class="dashboard-header">
      <div>
        <h1>Bonjour, {{ userFirstName || 'Étudiant' }} 👋</h1>
        <p class="date-display">{{ new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }}</p>
      </div>
    </div>
    
    <div v-if="isLoading" style="text-align:center; padding:2rem; color:var(--text-light);">
        Chargement de vos données...
    </div>

    <div v-else class="grid-2">
      <!-- Progression des Cours -->
      <div class="card">
        <div class="card-header">
          <h2><BookOpen size="20" style="margin-right:8px; vertical-align:text-bottom; color:var(--primary);"/> Mes Cours</h2>
          <router-link to="/courses" class="link-btn">Gérer</router-link>
        </div>
        
        <div v-if="courses.length === 0" class="empty-box">
          <BookOpen class="empty-icon" size="40" />
          <div class="empty-text">Aucun cours suivi</div>
          <div class="empty-sub">Ajoute ton premier cours pour commencer à suivre ta progression.</div>
          <router-link to="/courses" style="margin-top:0.5rem; font-weight:600; color:var(--primary); text-decoration:none;">Ajouter un cours &rarr;</router-link>
        </div>
        
        <div v-for="course in courses" :key="course.id" class="course-item">
          <div class="course-details">
            <span class="course-name">{{ course.name }}</span>
            <span class="course-percent">{{ course.progress }}%</span>
          </div>
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: course.progress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Colonne Droite : Planning & Deadlines -->
      <div class="right-column">
        
        <!-- Tâches du jour -->
        <div class="card">
          <h2><CheckCircle size="20" style="margin-right:8px; vertical-align:text-bottom; color:var(--secondary);"/> Planning du jour</h2>
          
          <div v-if="todaysTasks.length === 0" class="empty-box" style="padding: 1.5rem;">
            <Clock class="empty-icon" size="32" />
            <div class="empty-text">Rien de prévu</div>
            <div class="empty-sub">Profite de ta journée libre !</div>
          </div>

          <ul class="task-list" v-else>
            <li v-for="(item, idx) in todaysTasks" :key="idx" class="task-item">
               <span class="check-icon">✓</span>
               <div>
                 <strong v-if="item.courseName">{{ item.courseName }} : </strong>
                 {{ item.task }}
               </div>
            </li>
          </ul>
        </div>

        <!-- Prochaines dates clés -->
        <div class="card">
          <h2><AlertCircle size="20" style="margin-right:8px; vertical-align:text-bottom; color:#f39c12;"/> Prochaines échéances</h2>
          
          <div v-if="deadlines.length === 0" class="empty-box" style="padding: 1.5rem;">
            <Calendar class="empty-icon" size="32" />
            <div class="empty-text">Aucune deadline</div>
            <div class="empty-sub">Génère un planning pour voir les dates clés.</div>
          </div>

          <div v-for="(deadline, idx) in deadlines" :key="idx" class="deadline-row">
            <div class="deadline-date">{{ formatDate(deadline.date) }}</div>
            <div class="deadline-info">{{ deadline.label }}</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Keep existing styles, just ensure empty-box is handled if not in global css yet (fallback) */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.date-display {
  color: var(--text-light);
  font-weight: 500;
  text-transform: capitalize;
  margin-top: 0.2rem;
}
/* ... existing styles ... */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}
.link-btn {
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  background: rgba(58, 122, 254, 0.1);
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
}
.course-item {
  margin-bottom: 1.2rem;
}
.course-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem;
  font-size: 0.95rem;
  font-weight: 500;
}
.course-percent {
  color: var(--primary);
}
.progress-bg {
  background: #EFF6FF;
  height: 8px;
  border-radius: 10px;
  overflow: hidden;
}
.progress-fill {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  height: 100%;
}
.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.task-item {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid #f5f5f5;
}
.task-item:last-child {
  border-bottom: none;
}
.check-icon {
  color: var(--white);
  background: var(--secondary);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  flex-shrink: 0;
  margin-top: 2px;
}
.deadline-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px dashed #e0e0e0;
}
.deadline-row:last-child {
  border-bottom: none;
}
.deadline-date {
  font-weight: bold;
  color: var(--text-dark);
  min-width: 60px;
}
.deadline-info {
  color: var(--text-light);
  font-size: 0.9rem;
}
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (max-width: 600px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
