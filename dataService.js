// State Variables
let users = [];
let documents = [];
let isDataLoaded = false;
let dataLoadPromise = null;

// Fetch Data Function
async function fetchData() {
  if (isDataLoaded || dataLoadPromise) {
    return dataLoadPromise;
  }

  dataLoadPromise = new Promise(async (resolve, reject) => {
    try {
      const response = await fetch('data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      users = data.users || [];
      documents = data.documents || [];

      // Pre-process documents
      documents.forEach(doc => {
        if (doc.assignedToUserId) {
          const user = users.find(u => u.id === doc.assignedToUserId);
          doc.reviewerName = user ? user.name : "Unassigned";
        } else {
          doc.reviewerName = "Unassigned";
        }
      });

      isDataLoaded = true;
      resolve();
    } catch (error) {
      console.error("Failed to fetch data:", error);
      isDataLoaded = false; // Reset flag
      dataLoadPromise = null; // Reset promise so it can be tried again
      reject(error);
    }
  });

  return dataLoadPromise;
}

// Getter Functions
async function getUsers() {
  if (!isDataLoaded) {
    await fetchData();
  }
  return JSON.parse(JSON.stringify(users));
}

async function getDocuments() {
  if (!isDataLoaded) {
    await fetchData();
  }
  return JSON.parse(JSON.stringify(documents));
}

async function getUserById(userId) {
  if (!isDataLoaded) {
    await fetchData();
  }
  const user = users.find(u => u.id === userId);
  return user ? JSON.parse(JSON.stringify(user)) : null;
}

async function getDocumentById(docId) {
  if (!isDataLoaded) {
    await fetchData();
  }
  const document = documents.find(d => d.id === docId);
  return document ? JSON.parse(JSON.stringify(document)) : null;
}

// Data Modification Functions
async function addDocument(docData) {
  if (!isDataLoaded) {
    // Ensure users are loaded to assign reviewerName correctly
    await fetchData();
  }

  const newDocument = { ...docData };
  newDocument.id = 'doc' + Date.now();
  newDocument.status = newDocument.status || "Not Started";

  if (newDocument.assignedToUserId) {
    const user = users.find(u => u.id === newDocument.assignedToUserId);
    newDocument.reviewerName = user ? user.name : "Unassigned";
  } else {
    newDocument.reviewerName = "Unassigned";
  }

  documents.push(newDocument);
  return JSON.parse(JSON.stringify(newDocument));
}

async function removeDocument(docId) {
  if (!isDataLoaded) {
    await fetchData(); // Ensure data is loaded before trying to modify
  }
  const docIndex = documents.findIndex(d => d.id === docId);
  if (docIndex > -1) {
    const removedDocument = documents.splice(docIndex, 1)[0];
    return JSON.parse(JSON.stringify(removedDocument));
  }
  return null;
}

async function addUser(userData) {
  if (!isDataLoaded) {
    // Though not strictly necessary for adding a user,
    // it's good practice to ensure data context is loaded.
    await fetchData();
  }
  const newUser = { ...userData };
  newUser.id = 'user' + Date.now();
  users.push(newUser);
  return JSON.parse(JSON.stringify(newUser));
}

async function removeUser(userId) {
  if (!isDataLoaded) {
    await fetchData();
  }
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    const removedUser = users.splice(userIndex, 1)[0];
    // Update documents assigned to this user
    documents.forEach(doc => {
      if (doc.assignedToUserId === userId) {
        doc.assignedToUserId = null;
        doc.reviewerName = "Unassigned";
      }
    });
    return JSON.parse(JSON.stringify(removedUser));
  }
  return null;
}

async function updateDocumentStatus(docId, newStatus) {
  if (!isDataLoaded) {
    await fetchData();
  }
  const document = documents.find(d => d.id === docId);
  if (document) {
    document.status = newStatus;
    return JSON.parse(JSON.stringify(document));
  }
  return null;
}

// Export Functions
export {
  fetchData,
  getUsers,
  getDocuments,
  getUserById,
  getDocumentById,
  addDocument,
  removeDocument,
  addUser,
  removeUser,
  updateDocumentStatus
};
