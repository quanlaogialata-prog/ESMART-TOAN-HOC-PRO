import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, setDoc, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, updatePassword, deleteUser } from "firebase/auth";
import { db, firebaseConfig } from "../../lib/firebase";
import { Users, UserPlus, BookOpen, Key, Trash2 } from "lucide-react";
export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("teacher");
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importGrade, setImportGrade] = useState("9");
  const [importClassName, setImportClassName] = useState("");
  const handleImportStudents = async () => {
    if (!importText.trim() || !importClassName) {
      setSysError("Vui l\xF2ng ch\u1ECDn l\u1EDBp v\xE0 nh\u1EADp danh s\xE1ch h\u1ECDc sinh.");
      setTimeout(() => setSysError(""), 3e3);
      return;
    }
    const lines = importText.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length === 0) return;
    setCreatingUser(true);
    setSysMsg(`\u0110ang nh\u1EADp ${lines.length} h\u1ECDc sinh...`);
    setSysError("");
    let secondApp = null;
    let successCount = 0;
    try {
      secondApp = initializeApp(firebaseConfig, "SecondaryAppImport" + Date.now());
      const secondAuth = getAuth(secondApp);
      const processedEmailsInCurrentBatch = /* @__PURE__ */ new Set();
      for (const name of lines) {
        const [rawName, phone] = name.split(",");
        const cleanName = rawName ? rawName.trim() : "Unknown";
        const cleanPhone = phone ? phone.trim() : "";
        const baseSafeName = cleanName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]/g, "");
        let finalSafeName = baseSafeName;
        let counter = 1;
        while (users.some((u) => u.email === `${finalSafeName}@toanhoc.pro`) || processedEmailsInCurrentBatch.has(`${finalSafeName}@toanhoc.pro`)) {
          finalSafeName = `${baseSafeName}${counter}`;
          counter++;
        }
        const email = `${finalSafeName}@toanhoc.pro`;
        processedEmailsInCurrentBatch.add(email);
        const nameParts = cleanName.trim().split(/\s+/);
        const firstName = nameParts[nameParts.length - 1] || "user";
        const firstNameNoTones = firstName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
        const password = `${firstNameNoTones}123456`;
        const cred = await createUserWithEmailAndPassword(secondAuth, email, password);
        const userData = {
          role: "student",
          email,
          fullName: cleanName,
          displayName: cleanName,
          parentPhone: cleanPhone,
          rawPassword: password,
          grade: importGrade,
          className: importClassName,
          permissions: { lessons: true, tests: true },
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await setDoc(doc(db, "users", cred.user.uid), userData);
        successCount++;
        setSysMsg(`\u0110\xE3 t\u1EA1o: ${successCount}/${lines.length}`);
      }
      setSysMsg(`\u0110\xE3 nh\u1EADp th\xE0nh c\xF4ng ${successCount} h\u1ECDc sinh.`);
      setShowImportModal(false);
      setImportText("");
      await loadData();
      setTimeout(() => setSysMsg(""), 3e3);
    } catch (error) {
      console.error(error);
      setSysError("L\u1ED7i trong qu\xE1 tr\xECnh nh\u1EADp: " + error.message);
    } finally {
      setCreatingUser(false);
      if (secondApp) {
        try {
          deleteApp(secondApp);
        } catch (e) {
        }
      }
    }
  };
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("teacher");
  const [newGrade, setNewGrade] = useState("9");
  const [newClassName, setNewClassName] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");
  const [showClassModal, setShowClassModal] = useState(false);
  const [sysMsg, setSysMsg] = useState("");
  const [syncingPasswords, setSyncingPasswords] = useState(false);
  const [sysError, setSysError] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [classFormGrade, setClassFormGrade] = useState("9");
  const [classFormName, setClassFormName] = useState("");
  const [newPerms, setNewPerms] = useState({ lessons: true, tests: true });
  const [creatingUser, setCreatingUser] = useState(false);
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(data);
      const clsSnap = await getDocs(collection(db, "classes"));
      const fetchedClasses = clsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      fetchedClasses.sort((a, b) => {
        const gradeDiff = Number(a.grade || 0) - Number(b.grade || 0);
        if (gradeDiff !== 0) return gradeDiff;
        return (a.name || "").localeCompare(b.name || "");
      });
      setSchoolClasses(fetchedClasses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const [editingUserPass, setEditingUserPass] = useState(null);
  const [newPass, setNewPass] = useState("");
  const handleUpdatePassword = async () => {
    if (!newPass || newPass.length < 6) {
      setSysError("M\u1EADt kh\u1EA9u m\u1EDBi ph\u1EA3i t\u1EEB 6 k\xFD t\u1EF1 tr\u1EDF l\xEAn.");
      return;
    }
    setSysMsg("\u0110ang c\u1EADp nh\u1EADt m\u1EADt kh\u1EA9u...");
    setSysError("");
    let secondApp = null;
    try {
      secondApp = initializeApp(firebaseConfig, "SecondaryAppPass" + Date.now());
      const secondAuth = getAuth(secondApp);
      const cred = await signInWithEmailAndPassword(secondAuth, editingUserPass.email, editingUserPass.rawPassword);
      await updatePassword(cred.user, newPass);
      await updateDoc(doc(db, "users", editingUserPass.id), { rawPassword: newPass });
      await signOut(secondAuth);
      await loadData();
      setSysMsg("C\u1EADp nh\u1EADt m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng.");
      setEditingUserPass(null);
      setNewPass("");
      setTimeout(() => setSysMsg(""), 3e3);
    } catch (e) {
      console.error(e);
      setSysError("L\u1ED7i \u0111\u1ED5i m\u1EADt kh\u1EA9u: " + e.message);
    } finally {
      if (secondApp) deleteApp(secondApp);
    }
  };
  const [userToDelete, setUserToDelete] = useState(null);
  const handleDeleteUser = async (u) => {
    if (!u.rawPassword) {
      setSysError("Kh\xF4ng th\u1EC3 x\xF3a t\xE0i kho\u1EA3n v\xEC thi\u1EBFu m\u1EADt kh\u1EA9u g\u1ED1c (c\u1EA7n \u0111\u1EC3 x\xE1c th\u1EF1c l\u1EA1i).");
      setTimeout(() => setSysError(""), 4e3);
      return;
    }
    if (userToDelete !== u.id) {
      setUserToDelete(u.id);
      setTimeout(() => setUserToDelete(null), 3e3);
      return;
    }
    setUserToDelete(null);
    setSysMsg("\u0110ang x\xF3a t\xE0i kho\u1EA3n...");
    setSysError("");
    let secondApp = null;
    try {
      secondApp = initializeApp(firebaseConfig, "SecondaryAppDel" + Date.now());
      const secondAuth = getAuth(secondApp);
      const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
      await deleteUser(cred.user);
      await deleteDoc(doc(db, "users", u.id));
      if (u.role === "student") {
        const qStats = query(collection(db, "student_stats"), where("studentId", "==", u.id));
        const snapStats = await getDocs(qStats);
        snapStats.forEach((d) => deleteDoc(d.ref));
        const qSubs = query(collection(db, "submissions"), where("studentId", "==", u.id));
        const snapSubs = await getDocs(qSubs);
        snapSubs.forEach((d) => deleteDoc(d.ref));
      }
      await loadData();
      setSysMsg("\u0110\xE3 x\xF3a t\xE0i kho\u1EA3n th\xE0nh c\xF4ng.");
      setTimeout(() => setSysMsg(""), 3e3);
    } catch (e) {
      console.error(e);
      setSysError("L\u1ED7i x\xF3a t\xE0i kho\u1EA3n: " + e.message);
    } finally {
      if (secondApp) deleteApp(secondApp);
    }
  };
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const handleDeleteAllStudents = async () => {
    if (users.filter((u) => u.role === "student").length === 0) {
      setSysError("Kh\xF4ng c\xF3 h\u1ECDc sinh n\xE0o \u0111\u1EC3 x\xF3a.");
      setTimeout(() => setSysError(""), 3e3);
      return;
    }
    if (!window.confirm("C\u1EA2NH B\xC1O: H\xE0nh \u0111\u1ED9ng n\xE0y s\u1EBD x\xF3a TO\xC0N B\u1ED8 h\u1ECDc sinh c\xF9ng v\u1EDBi t\u1EA5t c\u1EA3 d\u1EEF li\u1EC7u b\xE0i t\u1EADp v\xE0 \u0111i\u1EC3m s\u1ED1 c\u1EE7a h\u1ECD. B\u1EA1n c\xF3 ch\u1EAFc ch\u1EAFn mu\u1ED1n ti\u1EBFp t\u1EE5c?")) {
      return;
    }
    setIsDeletingAll(true);
    setSysMsg("\u0110ang x\xF3a to\xE0n b\u1ED9 danh s\xE1ch h\u1ECDc sinh. Vui l\xF2ng kh\xF4ng \u0111\xF3ng trang web n\xE0y...");
    const studentsList = users.filter((u) => u.role === "student");
    let successCount = 0;
    try {
      const secondApp = initializeApp(firebaseConfig, "SecondaryAppDelAll" + Date.now());
      const secondAuth = getAuth(secondApp);
      for (const u of studentsList) {
        if (!u.rawPassword) continue;
        try {
          const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
          await deleteUser(cred.user);
          await deleteDoc(doc(db, "users", u.id));
          const qStats = query(collection(db, "student_stats"), where("studentId", "==", u.id));
          const snapStats = await getDocs(qStats);
          const deleteStatsPromises = snapStats.docs.map((d) => deleteDoc(d.ref));
          await Promise.all(deleteStatsPromises);
          const qSubs = query(collection(db, "submissions"), where("studentId", "==", u.id));
          const snapSubs = await getDocs(qSubs);
          const deleteSubsPromises = snapSubs.docs.map((d) => deleteDoc(d.ref));
          await Promise.all(deleteSubsPromises);
          successCount++;
        } catch (e) {
          console.error(`L\u1ED7i khi x\xF3a h\u1ECDc sinh ${u.email}:`, e);
        }
      }
      deleteApp(secondApp);
      await loadData();
      setSysMsg(`\u0110\xE3 x\xF3a th\xE0nh c\xF4ng ${successCount} h\u1ECDc sinh.`);
      setTimeout(() => setSysMsg(""), 5e3);
    } catch (e) {
      console.error(e);
      setSysError("C\xF3 l\u1ED7i x\u1EA3y ra trong qu\xE1 tr\xECnh x\xF3a h\xE0ng lo\u1EA1t.");
    } finally {
      setIsDeletingAll(false);
    }
  };
  const handleDeleteClass = async (classId) => {
    if (classToDelete !== classId) {
      setClassToDelete(classId);
      setTimeout(() => setClassToDelete(null), 3e3);
      return;
    }
    setSysMsg("\u0110ang x\xF3a l\u1EDBp v\xE0 danh s\xE1ch h\u1ECDc sinh...");
    const cls = schoolClasses.find((c) => c.id === classId);
    if (cls) {
      const studentsInClass = users.filter((u) => u.role === "student" && u.className === cls.name);
      if (studentsInClass.length > 0) {
        try {
          const secondApp = initializeApp(firebaseConfig, "SecondaryAppDelClass" + Date.now());
          const secondAuth = getAuth(secondApp);
          for (const u of studentsInClass) {
            try {
              if (u.rawPassword) {
                const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
                await deleteUser(cred.user);
              }
              await deleteDoc(doc(db, "users", u.id));
              const qStats = query(collection(db, "student_stats"), where("studentId", "==", u.id));
              const snapStats = await getDocs(qStats);
              await Promise.all(snapStats.docs.map((d) => deleteDoc(d.ref)));
              const qSubs = query(collection(db, "submissions"), where("studentId", "==", u.id));
              const snapSubs = await getDocs(qSubs);
              await Promise.all(snapSubs.docs.map((d) => deleteDoc(d.ref)));
            } catch (err) {
              console.error("L\u1ED7i khi x\xF3a h\u1ECDc sinh:", u.email, err);
            }
          }
          deleteApp(secondApp);
        } catch (err) {
          console.error("L\u1ED7i kh\u1EDFi t\u1EA1o Auth ph\u1EE5:", err);
        }
      }
    }
    await deleteDoc(doc(db, "classes", classId));
    setClassToDelete(null);
    setSysMsg("\u0110\xE3 x\xF3a l\u1EDBp v\xE0 h\u1ECDc sinh th\xE0nh c\xF4ng.");
    setTimeout(() => setSysMsg(""), 3e3);
    loadData();
  };
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!classFormName) return;
    await addDoc(collection(db, "classes"), {
      grade: classFormGrade,
      name: classFormName
    });
    setClassFormName("");
    setShowClassModal(false);
    loadData();
  };
  const handleSyncPasswords = async () => {
    setSyncingPasswords(true);
    setSysMsg("B\u1EAFt \u0111\u1EA7u \u0111\u1ED3ng b\u1ED9 m\u1EADt kh\u1EA9u...");
    setSysError("");
    try {
      const appName = "SecondaryAppSync_" + Date.now();
      const secondApp = initializeApp(firebaseConfig, appName);
      const secondAuth = getAuth(secondApp);
      let successCount = 0;
      let failCount = 0;
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      for (const u of allUsers) {
        if (!u.rawPassword || !u.email || !u.fullName) {
          failCount++;
          continue;
        }
        const nameParts = u.fullName.trim().split(/\s+/);
        const firstName = nameParts[nameParts.length - 1] || "user";
        const firstNameNoTones = firstName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
        const newPassword = `${firstNameNoTones}123456`;
        if (u.rawPassword === newPassword) {
          continue;
        }
        try {
          const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
          await updatePassword(cred.user, newPassword);
          await setDoc(doc(db, "users", u.id), { rawPassword: newPassword }, { merge: true });
          await signOut(secondAuth);
          successCount++;
          setSysMsg(`\u0110ang \u0111\u1ED3ng b\u1ED9... (${successCount} th\xE0nh c\xF4ng)`);
        } catch (err) {
          console.error("L\u1ED7i khi \u0111\u1ED3ng b\u1ED9 user:", u.email, err);
          failCount++;
          if (secondAuth.currentUser) {
            await signOut(secondAuth);
          }
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      setSysMsg(`\u0110\u1ED3ng b\u1ED9 ho\xE0n t\u1EA5t! C\u1EADp nh\u1EADt th\xE0nh c\xF4ng: ${successCount}, B\u1ECF qua/L\u1ED7i: ${failCount}`);
      loadData();
      try {
        await deleteApp(secondApp);
      } catch (e) {
      }
    } catch (err) {
      console.error(err);
      setSysError("L\u1ED7i h\u1EC7 th\u1ED1ng: " + err.message);
    } finally {
      setSyncingPasswords(false);
      setTimeout(() => setSysMsg(""), 6e3);
    }
  };
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newFullName) {
      setSysError("Vui l\xF2ng nh\u1EADp h\u1ECD v\xE0 t\xEAn");
      setTimeout(() => setSysError(""), 3e3);
      return;
    }
    setCreatingUser(true);
    let secondApp = null;
    try {
      secondApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
      const secondAuth = getAuth(secondApp);
      const baseSafeName = newFullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]/g, "");
      let finalSafeName = baseSafeName;
      let counter = 1;
      while (users.some((u) => u.email === `${finalSafeName}@toanhoc.pro`)) {
        finalSafeName = `${baseSafeName}${counter}`;
        counter++;
      }
      const email = `${finalSafeName}@toanhoc.pro`;
      const nameParts = newFullName.trim().split(/\s+/);
      const firstName = nameParts[nameParts.length - 1] || "user";
      const firstNameNoTones = firstName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
      const generatedPassword = `${firstNameNoTones}123456`;
      const cred = await createUserWithEmailAndPassword(secondAuth, email, generatedPassword);
      const userData = {
        role: newRole,
        fullName: newFullName,
        email,
        displayName: newFullName,
        rawPassword: generatedPassword,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (newRole === "student") {
        userData.grade = newGrade;
        userData.className = newClassName || "Ch\u01B0a ph\xE2n l\u1EDBp";
        userData.permissions = newPerms;
      }
      await setDoc(doc(db, "users", cred.user.uid), userData);
      await signOut(secondAuth);
      setShowAddModal(false);
      setNewFullName("");
      setNewClassName("");
      setNewParentPhone("");
      loadData();
      setSysMsg("T\u1EA1o ng\u01B0\u1EDDi d\xF9ng th\xE0nh c\xF4ng!");
      setTimeout(() => setSysMsg(""), 3e3);
    } catch (err) {
      console.error(err);
      let errMsg = err.message;
      if (err.code === "auth/email-already-in-use") errMsg = "T\xE0i kho\u1EA3n (T\xEAn truy c\u1EADp) n\xE0y \u0111\xE3 t\u1ED3n t\u1EA1i!";
      else if (err.code === "auth/weak-password") errMsg = "M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1!";
      setSysError("L\u1ED7i t\u1EA1o ng\u01B0\u1EDDi d\xF9ng: " + errMsg);
      setTimeout(() => setSysError(""), 5e3);
    } finally {
      if (secondApp) {
        try {
          await deleteApp(secondApp);
        } catch (e2) {
          console.error(e2);
        }
      }
      setCreatingUser(false);
    }
  };
  const handleSaveAssignedClasses = async () => {
    if (!assigningTeacher) return;
    await updateDoc(doc(db, "users", assigningTeacher.id), {
      "permissions.assignedClasses": assignedClasses
    });
    setShowAssignModal(false);
    loadData();
  };
  const togglePermission = async (userId, currentPerms, field) => {
    const updated = { ...currentPerms, [field]: !currentPerms[field] };
    await updateDoc(doc(db, "users", userId), { permissions: updated });
    loadData();
  };
  if (loading) return /* @__PURE__ */ jsx("div", { children: "\u0110ang t\u1EA3i danh s\xE1ch ng\u01B0\u1EDDi d\xF9ng..." });
  const filteredUsers = users.filter((u) => u.role === activeTab).sort((a, b) => {
    if (activeTab === "student") {
      const gradeDiff = Number(a.grade || 0) - Number(b.grade || 0);
      if (gradeDiff !== 0) return gradeDiff;
      const classDiff = (a.className || "").localeCompare(b.className || "");
      if (classDiff !== 0) return classDiff;
    }
    const nameA = a.fullName || a.displayName || "";
    const nameB = b.fullName || b.displayName || "";
    return nameA.localeCompare(nameB);
  });
  return /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto space-y-8 pb-10", children: [
    /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-gray-800", children: "B\u1EA3ng \u0111i\u1EC1u khi\u1EC3n Qu\u1EA3n tr\u1ECB" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Qu\u1EA3n l\xFD t\xE0i kho\u1EA3n ng\u01B0\u1EDDi d\xF9ng v\xE0 h\u1EC7 th\u1ED1ng" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          onClick: () => setActiveTab("teacher"),
          className: `cursor-pointer p-6 rounded-xl shadow-sm border flex items-center justify-between transition-all ${activeTab === "teacher" ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white hover:border-blue-200"}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: `p-3 rounded-lg ${activeTab === "teacher" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"}`, children: /* @__PURE__ */ jsx(BookOpen, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: `font-medium ${activeTab === "teacher" ? "text-blue-800" : "text-gray-500 text-sm"}`, children: "Qu\u1EA3n l\xFD Gi\xE1o vi\xEAn" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-800", children: users.filter((u) => u.role === "teacher").length })
            ] })
          ] })
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          onClick: () => setActiveTab("student"),
          className: `cursor-pointer p-6 rounded-xl shadow-sm border flex items-center justify-between transition-all ${activeTab === "student" ? "border-orange-500 bg-orange-50" : "border-gray-100 bg-white hover:border-orange-200"}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: `p-3 rounded-lg ${activeTab === "student" ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-600"}`, children: /* @__PURE__ */ jsx(Users, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: `font-medium ${activeTab === "student" ? "text-orange-800" : "text-gray-500 text-sm"}`, children: "Qu\u1EA3n l\xFD H\u1ECDc sinh" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-800", children: users.filter((u) => u.role === "student").length })
            ] })
          ] })
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          onClick: () => setActiveTab("classes"),
          className: `cursor-pointer p-6 rounded-xl shadow-sm border flex items-center justify-between transition-all ${activeTab === "classes" ? "border-green-500 bg-green-50" : "border-gray-100 bg-white hover:border-green-200"}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: `p-3 rounded-lg ${activeTab === "classes" ? "bg-green-600 text-white" : "bg-green-100 text-green-600"}`, children: /* @__PURE__ */ jsx(BookOpen, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: `font-medium ${activeTab === "classes" ? "text-green-800" : "text-gray-500 text-sm"}`, children: "Qu\u1EA3n l\xFD Kh\u1ED1i L\u1EDBp" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-800", children: schoolClasses.length })
            ] })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100 flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-gray-800", children: [
          "Danh s\xE1ch ",
          activeTab === "teacher" ? "Gi\xE1o vi\xEAn" : activeTab === "student" ? "H\u1ECDc sinh" : "Kh\u1ED1i L\u1EDBp"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          (activeTab === "student" || activeTab === "teacher") && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleSyncPasswords,
              disabled: syncingPasswords,
              className: "bg-yellow-500 text-white border border-yellow-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-yellow-600 transition-colors disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(Key, { size: 16 }),
                " ",
                syncingPasswords ? "\u0110ang \u0111\u1ED3ng b\u1ED9..." : "\u0110\u1ED3ng b\u1ED9 M\u1EADt kh\u1EA9u"
              ]
            }
          ),
          activeTab === "student" && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowImportModal(true),
              className: "bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-green-700",
              children: "Nh\u1EADp danh s\xE1ch"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                if (activeTab === "classes") {
                  setShowClassModal(true);
                } else {
                  setNewRole(activeTab);
                  setShowAddModal(true);
                }
              },
              className: "bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-blue-700",
              children: [
                /* @__PURE__ */ jsx(UserPlus, { size: 16 }),
                " Th\xEAm ",
                activeTab === "teacher" ? "gi\xE1o vi\xEAn" : activeTab === "student" ? "h\u1ECDc sinh" : "kh\u1ED1i l\u1EDBp"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: activeTab !== "classes" ? /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 text-gray-600 border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "H\u1ECD v\xE0 T\xEAn" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "T\xEAn hi\u1EC3n th\u1ECB" }),
          activeTab === "student" && /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "Kh\u1ED1i" }),
          activeTab === "student" && /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "L\u1EDBp" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "H\xE0nh \u0111\u1ED9ng" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-gray-100", children: [
          filteredUsers.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "px-6 py-8 text-center text-gray-500", children: "Ch\u01B0a c\xF3 d\u1EEF li\u1EC7u" }) }),
          filteredUsers.map((u) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50/50", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-medium text-gray-800", children: u.fullName || u.displayName }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-gray-600", children: u.displayName }),
            activeTab === "student" && /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 text-gray-600", children: [
              "Kh\u1ED1i ",
              u.grade || "9"
            ] }),
            activeTab === "student" && /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-gray-600", children: u.className || "-" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "flex gap-2 items-center flex-wrap", children: u.role === "student" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => togglePermission(u.id, u.permissions || { lessons: true, tests: true }, "lessons"),
                  className: `text-xs px-2 py-1 rounded border ${u.permissions?.lessons !== false ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`,
                  children: [
                    "B\xE0i h\u1ECDc: ",
                    u.permissions?.lessons !== false ? "B\u1EADt" : "T\u1EAFt"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => togglePermission(u.id, u.permissions || { lessons: true, tests: true }, "tests"),
                  className: `text-xs px-2 py-1 rounded border ${u.permissions?.tests !== false ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-red-50 border-red-200 text-red-700"}`,
                  children: [
                    "Ki\u1EC3m tra: ",
                    u.permissions?.tests !== false ? "B\u1EADt" : "T\u1EAFt"
                  ]
                }
              ),
              /* @__PURE__ */ jsx("button", { onClick: () => {
                setEditingUserPass(u);
                setNewPass("");
                setSysError("");
              }, className: "text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700", children: "\u0110\u1ED5i MK" }),
              /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteUser(u), className: `text-xs px-2 py-1 rounded border ${userToDelete === u.id ? "bg-red-600 text-white border-red-600" : "bg-red-50 border-red-200 text-red-700"}`, children: userToDelete === u.id ? "X\xE1c nh\u1EADn x\xF3a" : "X\xF3a" })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => togglePermission(u.id, u.permissions || { lessons: true, tests: true }, "lessons"),
                  className: `text-xs px-2 py-1 rounded border ${u.permissions?.lessons !== false ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`,
                  children: [
                    "B\xE0i h\u1ECDc: ",
                    u.permissions?.lessons !== false ? "B\u1EADt" : "T\u1EAFt"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => togglePermission(u.id, u.permissions || { lessons: true, tests: true }, "tests"),
                  className: `text-xs px-2 py-1 rounded border ${u.permissions?.tests !== false ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-red-50 border-red-200 text-red-700"}`,
                  children: [
                    "Ki\u1EC3m tra: ",
                    u.permissions?.tests !== false ? "B\u1EADt" : "T\u1EAFt"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    setAssigningTeacher(u);
                    setAssignedClasses(u.permissions?.assignedClasses || []);
                    setShowAssignModal(true);
                  },
                  className: "text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1",
                  children: [
                    "Giao l\u1EDBp (",
                    u.permissions?.assignedClasses?.length || 0,
                    ")"
                  ]
                }
              ),
              /* @__PURE__ */ jsx("button", { onClick: () => {
                setEditingUserPass(u);
                setNewPass("");
                setSysError("");
              }, className: "text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700", children: "\u0110\u1ED5i MK" }),
              /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteUser(u), className: `text-xs px-2 py-1 rounded border ${userToDelete === u.id ? "bg-red-600 text-white border-red-600" : "bg-red-50 border-red-200 text-red-700"}`, children: userToDelete === u.id ? "X\xE1c nh\u1EADn x\xF3a" : "X\xF3a" })
            ] }) }) })
          ] }, u.id))
        ] })
      ] }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 text-gray-600 border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "Kh\u1ED1i" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "T\xEAn L\u1EDBp" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "S\u0129 s\u1ED1" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "H\xE0nh \u0111\u1ED9ng" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-gray-100", children: [
          schoolClasses.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-6 py-8 text-center text-gray-500", children: "Ch\u01B0a c\xF3 d\u1EEF li\u1EC7u" }) }),
          schoolClasses.map((cls) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50/50", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 font-medium text-gray-800", children: [
              "Kh\u1ED1i ",
              cls.grade
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-gray-600", children: cls.name }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 text-gray-600 font-medium text-blue-600", children: [
              users.filter((u) => u.role === "student" && String(u.grade) === String(cls.grade) && u.className === cls.name).length,
              " h\u1ECDc sinh"
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-gray-600", children: /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteClass(cls.id), className: `text-xs px-2 py-1 rounded border ${classToDelete === cls.id ? "bg-red-600 text-white border-red-600" : "text-red-500 border-red-200 bg-red-50"}`, children: classToDelete === cls.id ? "X\xE1c nh\u1EADn x\xF3a" : "X\xF3a" }) })
          ] }, cls.id))
        ] })
      ] }) })
    ] }),
    showAssignModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-gray-800", children: "Giao L\u1EDBp cho Gi\xE1o vi\xEAn" }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mb-2", children: [
          "Ch\u1ECDn c\xE1c kh\u1ED1i/l\u1EDBp m\xE0 gi\xE1o vi\xEAn ",
          /* @__PURE__ */ jsx("strong", { children: assigningTeacher?.displayName }),
          " \u0111\u01B0\u1EE3c ph\xE9p qu\u1EA3n l\xFD:"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3", children: schoolClasses.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 italic", children: "Ch\u01B0a c\xF3 l\u1EDBp n\xE0o \u0111\u01B0\u1EE3c t\u1EA1o." }) : schoolClasses.map((cls) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: assignedClasses.includes(cls.id),
              onChange: (e) => {
                if (e.target.checked) {
                  setAssignedClasses([...assignedClasses, cls.id]);
                } else {
                  setAssignedClasses(assignedClasses.filter((id) => id !== cls.id));
                }
              },
              className: "w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-gray-800", children: [
            "Kh\u1ED1i ",
            cls.grade,
            " - L\u1EDBp ",
            cls.name
          ] })
        ] }, cls.id)) }),
        sysMsg && /* @__PURE__ */ jsx("div", { className: "text-green-600 text-sm font-medium", children: sysMsg }),
        sysError && /* @__PURE__ */ jsx("div", { className: "text-red-600 text-sm font-medium", children: sysError }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowAssignModal(false),
              className: "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors",
              children: "\u0110\xF3ng"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSaveAssignedClasses,
              className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors",
              children: "L\u01B0u thay \u0111\u1ED5i"
            }
          )
        ] })
      ] })
    ] }) }),
    showClassModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-gray-800", children: "Th\xEAm L\u1EDBp M\u1EDBi" }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCreateClass, className: "p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Kh\u1ED1i" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: classFormGrade,
                onChange: (e) => setClassFormGrade(e.target.value),
                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "6", children: "Kh\u1ED1i 6" }),
                  /* @__PURE__ */ jsx("option", { value: "7", children: "Kh\u1ED1i 7" }),
                  /* @__PURE__ */ jsx("option", { value: "8", children: "Kh\u1ED1i 8" }),
                  /* @__PURE__ */ jsx("option", { value: "9", children: "Kh\u1ED1i 9" }),
                  /* @__PURE__ */ jsx("option", { value: "10", children: "Kh\u1ED1i 10" }),
                  /* @__PURE__ */ jsx("option", { value: "11", children: "Kh\u1ED1i 11" }),
                  /* @__PURE__ */ jsx("option", { value: "12", children: "Kh\u1ED1i 12" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "T\xEAn L\u1EDBp" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                required: true,
                value: classFormName,
                onChange: (e) => setClassFormName(e.target.value),
                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
                placeholder: "VD: 9A1"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowClassModal(false),
              className: "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors",
              children: "H\u1EE7y"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2",
              children: "Th\xEAm L\u1EDBp"
            }
          )
        ] })
      ] })
    ] }) }),
    showDeleteDataModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100 flex justify-between items-center bg-red-50", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-red-800", children: "X\xF3a d\u1EEF li\u1EC7u b\xE0i h\u1ECDc theo kh\u1ED1i" }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Ch\u1ECDn kh\u1ED1i l\u1EDBp m\xE0 b\u1EA1n mu\u1ED1n x\xF3a to\xE0n b\u1ED9 d\u1EEF li\u1EC7u (ch\u1EE7 \u0111\u1EC1, b\xE0i h\u1ECDc, b\xE0i ki\u1EC3m tra)." }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Kh\u1ED1i L\u1EDBp" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: deleteDataGrade,
              onChange: (e) => setDeleteDataGrade(e.target.value),
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "T\u1EA5t c\u1EA3 c\xE1c kh\u1ED1i (X\xF3a s\u1EA1ch)" }),
                /* @__PURE__ */ jsx("option", { value: "6", children: "Kh\u1ED1i 6" }),
                /* @__PURE__ */ jsx("option", { value: "7", children: "Kh\u1ED1i 7" }),
                /* @__PURE__ */ jsx("option", { value: "8", children: "Kh\u1ED1i 8" }),
                /* @__PURE__ */ jsx("option", { value: "9", children: "Kh\u1ED1i 9" }),
                /* @__PURE__ */ jsx("option", { value: "10", children: "Kh\u1ED1i 10" }),
                /* @__PURE__ */ jsx("option", { value: "11", children: "Kh\u1ED1i 11" }),
                /* @__PURE__ */ jsx("option", { value: "12", children: "Kh\u1ED1i 12" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowDeleteDataModal(false),
              className: "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors",
              children: "H\u1EE7y"
            }
          ),
          /* @__PURE__ */ jsxs("button", { onClick: handleDeleteDataByGrade, disabled: isDeletingData, className: "flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50", children: [
            /* @__PURE__ */ jsx(Trash2, { size: 16 }),
            " ",
            isDeletingData ? "\u0110ang x\xF3a..." : "X\xF3a ngay"
          ] })
        ] })
      ] })
    ] }) }),
    editingUserPass && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-md w-full p-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold mb-4", children: [
        "\u0110\u1ED5i m\u1EADt kh\u1EA9u: ",
        editingUserPass.displayName
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "M\u1EADt kh\u1EA9u m\u1EDBi" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: newPass,
              onChange: (e) => setNewPass(e.target.value),
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
              placeholder: "Nh\u1EADp m\u1EADt kh\u1EA9u m\u1EDBi (\xEDt nh\u1EA5t 6 k\xFD t\u1EF1)"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end mt-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setEditingUserPass(null);
                setNewPass("");
                setSysError("");
              },
              className: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium",
              children: "H\u1EE7y"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleUpdatePassword,
              className: "px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700",
              children: "C\u1EADp nh\u1EADt"
            }
          )
        ] })
      ] })
    ] }) }),
    showImportModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-lg w-full p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold mb-4", children: "Nh\u1EADp danh s\xE1ch H\u1ECDc sinh" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-1/3", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Kh\u1ED1i" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: importGrade,
                onChange: (e) => {
                  setImportGrade(e.target.value);
                  setImportClassName("");
                },
                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "6", children: "Kh\u1ED1i 6" }),
                  /* @__PURE__ */ jsx("option", { value: "7", children: "Kh\u1ED1i 7" }),
                  /* @__PURE__ */ jsx("option", { value: "8", children: "Kh\u1ED1i 8" }),
                  /* @__PURE__ */ jsx("option", { value: "9", children: "Kh\u1ED1i 9" }),
                  /* @__PURE__ */ jsx("option", { value: "10", children: "Kh\u1ED1i 10" }),
                  /* @__PURE__ */ jsx("option", { value: "11", children: "Kh\u1ED1i 11" }),
                  /* @__PURE__ */ jsx("option", { value: "12", children: "Kh\u1ED1i 12" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "L\u1EDBp" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: importClassName,
                onChange: (e) => setImportClassName(e.target.value),
                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "-- Ch\u1ECDn l\u1EDBp --" }),
                  schoolClasses.filter((c) => c.grade === importGrade).map((c) => /* @__PURE__ */ jsx("option", { value: c.name, children: c.name }, c.id))
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Danh s\xE1ch h\u1ECDc sinh" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mb-2", children: "Nh\u1EADp t\xEAn h\u1ECDc sinh (ho\u1EB7c copy t\u1EEB file Excel/Text), m\u1ED7i h\u1ECDc sinh tr\xEAn m\u1ED9t d\xF2ng." }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: importText,
              onChange: (e) => setImportText(e.target.value),
              rows: 8,
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
              placeholder: "Nguy\u1EC5n V\u0103n A\nTr\u1EA7n Th\u1ECB B\nL\xEA V\u0103n C"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end mt-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowImportModal(false),
              disabled: creatingUser,
              className: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium",
              children: "H\u1EE7y"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleImportStudents,
              disabled: creatingUser,
              className: "px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2",
              children: creatingUser ? "\u0110ang nh\u1EADp..." : "B\u1EAFt \u0111\u1EA7u nh\u1EADp"
            }
          )
        ] })
      ] })
    ] }) }),
    showAddModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-gray-800", children: [
        "Th\xEAm ",
        newRole === "teacher" ? "Gi\xE1o vi\xEAn" : "H\u1ECDc sinh",
        " m\u1EDBi"
      ] }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCreateUser, className: "p-6 space-y-4", children: [
        sysError && /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4", children: sysError }),
        sysMsg && /* @__PURE__ */ jsx("div", { className: "p-3 bg-green-50 text-green-600 rounded-lg text-sm mb-4", children: sysMsg }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "H\u1ECD v\xE0 t\xEAn" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              required: true,
              value: newFullName,
              onChange: (e) => setNewFullName(e.target.value),
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
              placeholder: "VD: Nguy\u1EC5n V\u0103n A"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "M\u1EADt kh\u1EA9u m\u1EB7c \u0111\u1ECBnh: T\xEAn (ch\u1EEF th\u01B0\u1EDDng, kh\xF4ng d\u1EA5u) + 123456 (VD: tuan123456)" })
        ] }),
        newRole === "student" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Kh\u1ED1i" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: newGrade,
                  onChange: (e) => {
                    setNewGrade(e.target.value);
                    const firstClass = schoolClasses.find((c) => c.grade === e.target.value);
                    if (firstClass) setNewClassName(firstClass.name);
                    else setNewClassName("");
                  },
                  className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "6", children: "Kh\u1ED1i 6" }),
                    /* @__PURE__ */ jsx("option", { value: "7", children: "Kh\u1ED1i 7" }),
                    /* @__PURE__ */ jsx("option", { value: "8", children: "Kh\u1ED1i 8" }),
                    /* @__PURE__ */ jsx("option", { value: "9", children: "Kh\u1ED1i 9" }),
                    /* @__PURE__ */ jsx("option", { value: "10", children: "Kh\u1ED1i 10" }),
                    /* @__PURE__ */ jsx("option", { value: "11", children: "Kh\u1ED1i 11" }),
                    /* @__PURE__ */ jsx("option", { value: "12", children: "Kh\u1ED1i 12" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "L\u1EDBp" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: newClassName,
                  onChange: (e) => setNewClassName(e.target.value),
                  className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "-- Ch\u1ECDn l\u1EDBp --" }),
                    schoolClasses.filter((c) => c.grade === newGrade).map((c) => /* @__PURE__ */ jsx("option", { value: c.name, children: c.name }, c.id))
                  ]
                }
              )
            ] })
          ] }),
          newRole === "student" && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "S\u0110T Ph\u1EE5 huynh" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: newParentPhone,
                onChange: (e) => setNewParentPhone(e.target.value),
                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",
                placeholder: "Nh\u1EADp s\u1ED1 \u0111i\u1EC7n tho\u1EA1i Zalo c\u1EE7a ph\u1EE5 huynh..."
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Ph\xE2n quy\u1EC1n m\u1EB7c \u0111\u1ECBnh" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: newPerms.lessons,
                    onChange: (e) => setNewPerms({ ...newPerms, lessons: e.target.checked })
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-sm", children: "V\xE0o B\xE0i h\u1ECDc" })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: newPerms.tests,
                    onChange: (e) => setNewPerms({ ...newPerms, tests: e.target.checked })
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-sm", children: "L\xE0m Ki\u1EC3m tra" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex gap-3 justify-end", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowAddModal(false),
              className: "px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors",
              children: "H\u1EE7y"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: creatingUser,
              className: "px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50",
              children: creatingUser ? "\u0110ang t\u1EA1o..." : "T\u1EA1o t\xE0i kho\u1EA3n"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
