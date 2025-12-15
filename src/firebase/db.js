import { db } from './firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    getDoc,
    setDoc,
    writeBatch
} from 'firebase/firestore';

// References
export const getUserRef = (uid) => doc(db, 'users', uid);
export const getCoursesRef = (uid) => collection(db, 'users', uid, 'courses');
export const getPlanningRef = (uid) => collection(db, 'users', uid, 'planning');

// Courses
export const addCourseToDb = (uid, courseData) => {
    return addDoc(getCoursesRef(uid), { ...courseData, createdAt: new Date() });
};

export const updateCourseInDb = (uid, courseId, data) => {
    return updateDoc(doc(db, 'users', uid, 'courses', courseId), data);
};

export const deleteCourseFromDb = (uid, courseId) => {
    return deleteDoc(doc(db, 'users', uid, 'courses', courseId));
};

// Planning
export const savePlanningToDb = async (uid, courseId, newTasks) => {
    const batch = writeBatch(db);
    const planRef = getPlanningRef(uid);

    // 1. Delete old tasks for this course
    // Note: ideally we query to get IDs first. 
    // For simplicity assuming caller might have IDs or we just query here.
    const q = query(planRef, where("courseId", "==", courseId));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // 2. Add new tasks
    newTasks.forEach(task => {
        const newDoc = doc(planRef);
        batch.set(newDoc, task);
    });

    return batch.commit();
};

export const clearPlanningDb = async (uid) => {
    const batch = writeBatch(db);
    const q = query(getPlanningRef(uid));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
};
