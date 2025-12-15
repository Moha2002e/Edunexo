<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { BookOpen, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-vue-next';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore'; 

const courses = ref([]);
const deadlines = ref([]); 
const todaysTasks = ref([]);
const userFirstName = ref('');
const isLoading = ref(true);

// Stats
const stats = ref({
    streak: 0,
    totalTasks: 0,
    completedTasks: 0
});

// Quotes
const quotes = [
    "L'éducation est l'arme la plus puissante pour changer le monde.",
    "Ce n'est pas que je suis si intelligent, c'est que je reste plus longtemps avec les problèmes. - Einstein",
    "L'apprentissage est la seule chose que l'esprit n'épuise jamais. - Da Vinci",
    "Le succès, c'est tomber sept fois, se relever huit. - Proverbe japonais",
    "Investir dans le savoir rapporte le meilleur intérêt. - Benjamin Franklin"
];
const currentQuoteIndex = ref(0);
let quoteInterval;

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

        // 2. Load Todos & Calculate Stats
        const todayStr = getLocalToday();
        const planningRef = collection(db, 'users', user.uid, 'planning');
        const planningSnap = await getDocs(planningRef);
        const allPlanning = planningSnap.docs.map(d => d.data());
        
        todaysTasks.value = allPlanning.filter(p => p.day === todayStr);

        // Stats Logic
        stats.value.totalTasks = allPlanning.length;
        // As 'completed' field is not strictly enforced yet, we use a proxy or check if it exists
        stats.value.completedTasks = allPlanning.filter(p => p.completed === true).length;
        
        // Mock Streak for now (random realistic number or 0)
        // In a real app we'd query a user_activity collection
        stats.value.streak = stats.value.completedTasks > 0 ? Math.floor(stats.value.completedTasks / 3) + 1 : 0; 


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

    // Rotation des citations
    quoteInterval = setInterval(() => {
        currentQuoteIndex.value = (currentQuoteIndex.value + 1) % quotes.length;
    }, 5000); // Change toutes les 5 secondes
});

onUnmounted(() => {
    if (quoteInterval) clearInterval(quoteInterval);
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
    
    <!-- Stats Row -->
    <div class="stats-grid">
        <div class="stat-card">
            <span class="stat-label">🔥 Série de révision</span>
            <span class="stat-value">{{ stats.streak }} jours</span>
            <small style="color:var(--accent)">Continue comme ça !</small>
        </div>
        <div class="stat-card">
             <span class="stat-label">📚 Cours suivis</span>
            <span class="stat-value">{{ courses.length }}</span>
            <small style="color:var(--text-light)">Matières actives</small>
        </div>
        <div class="stat-card">
             <span class="stat-label">✅ Tâches Totales</span>
            <span class="stat-value">{{ stats.totalTasks }}</span>
            <small style="color:var(--secondary)">Enregistrées</small>
        </div>
        
        <!-- Rotating Quote -->
        <div class="stat-card quote-card">
            <span class="stat-label" style="color:rgba(255,255,255,0.9)">💡 Pensée du jour</span>
            <transition name="fade" mode="out-in">
                <p :key="currentQuoteIndex" class="quote-text">
                    "{{ quotes[currentQuoteIndex] }}"
                </p>
            </transition>
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
          <div class="card-header">
             <h2><CheckCircle size="20" style="margin-right:8px; vertical-align:text-bottom; color:var(--secondary);"/> Planning</h2>
             <router-link to="/planning" class="link-btn">Gérer</router-link>
          </div>
          
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
          <div class="card-header">
            <h2><AlertCircle size="20" style="margin-right:8px; vertical-align:text-bottom; color:#f39c12;"/> Échéances</h2>
            <router-link to="/planning" class="link-btn">Voir tout</router-link>
          </div>
          
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
/* Dashboard Styles */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.date-display {
  color: var(--text-light);
  font-weight: 500;
  text-transform: capitalize;
  margin-top: 0.25rem;
  font-size: 1.1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.link-btn {
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  background: #EFF6FF;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.link-btn:hover {
  background: #DBEAFE;
  color: #1E40AF;
}

.course-item {
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem; /* Space for separation if needed */
}

.course-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.6rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
}

.course-percent {
  color: var(--primary);
  font-weight: 700;
}

.progress-bg {
  background: #F1F5F9;
  height: 10px;
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  height: 100%;
  border-radius: 99px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
  border-radius: 12px;
}

.task-item:hover {
  background: #F8FAFC;
}

.task-item:last-child {
  border-bottom: none;
}

.check-icon {
  color: var(--secondary);
  background: #EEF2FF;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.deadline-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem;
  border-bottom: 1px dashed var(--border-color);
}

.deadline-row:last-child {
  border-bottom: none;
}

.deadline-date {
  font-weight: 700;
  color: var(--text-dark);
  min-width: 65px;
  text-align: center;
  background: #FEF3C7; /* Soft Amber */
  color: #D97706;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.deadline-info {
  color: var(--text-dark);
  font-size: 0.95rem;
  font-weight: 500;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.quote-card {
    background: linear-gradient(135deg, #4F46E5, #818CF8);
    color: white;
    border: none;
    position: relative;
    overflow: hidden;
}

.quote-text {
    font-style: italic;
    margin-top: 0.5rem;
    font-weight: 500;
    min-height: 3.5rem; 
}

/* Animations fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
