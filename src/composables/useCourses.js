import { ref } from 'vue';
import { db, auth } from '../firebase/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';

export function useCourses() {
    const courses = ref([]);
    const isLoading = ref(true);

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

    const addCourseEntry = async (name, totalChapters, teacher) => {
        const colRef = getCoursesCollection();
        if (!colRef) return;

        const courseData = {
            name,
            totalChapters: parseInt(totalChapters),
            completedChapters: 0,
            teacher: teacher || null,
            createdAt: new Date()
        };

        try {
            const docRef = await addDoc(colRef, courseData);
            courses.value.push({ id: docRef.id, ...courseData });
            return true;
        } catch (e) {
            console.error("Error adding course:", e);
            return false;
        }
    };

    const updateCourseProgress = async (course, amount) => {
        const newVal = course.completedChapters + amount;
        if (newVal >= 0 && newVal <= course.totalChapters) {
            const oldVal = course.completedChapters;
            course.completedChapters = newVal; // Optimistic

            const colRef = getCoursesCollection();
            if (colRef) {
                try {
                    await updateDoc(doc(colRef, course.id), { completedChapters: newVal });
                } catch (e) {
                    console.error("Error updating progress:", e);
                    course.completedChapters = oldVal; // Revert
                }
            }
        }
    };

    const updateCourseDetails = async (courseId, updates) => {
        const colRef = getCoursesCollection();
        if (colRef) {
            try {
                await updateDoc(doc(colRef, courseId), updates);

                const index = courses.value.findIndex(c => c.id === courseId);
                if (index !== -1) {
                    courses.value[index] = { ...courses.value[index], ...updates };
                }
                return true;
            } catch (e) {
                console.error("Error updating course:", e);
                return false;
            }
        }
        return false;
    };

    const removeCourse = async (id) => {
        const oldList = [...courses.value];
        courses.value = courses.value.filter(c => c.id !== id);

        const colRef = getCoursesCollection();
        if (colRef) {
            try {
                await deleteDoc(doc(colRef, id));
            } catch (e) {
                console.error("Error deleting course:", e);
                courses.value = oldList; // Revert
            }
        }
    };

    return {
        courses,
        isLoading,
        loadCourses,
        addCourseEntry,
        updateCourseProgress,
        updateCourseDetails,
        removeCourse
    };
}
