//variable for db connection
let db;

//indexedDB database, set to version 1
const request = indexedDB.open('budget_tracker', 1);

//this event will emit if the database version changes
request.onupgradeneeded = function(event) {
    const db = event.target.result
    //object store with auto incrementing key
    db.createObjectStore('new_budget', { autoIncrement: true })
}

//on success
request.onsuccess = function(event) {
    db = event.target.result

    if(navigator.onLine) {
        uploadBudget()
    }
}

//on failure
request.onerror = function(event) {
    console.log(event.target.errorCode)
}

//submit budget with no internet connection
function saveRecord(record) {
    const transaction = db.transaction(['new_budget'], 'readwrite')
    const budgetObjectStore = transaction.objectStore('new_budget')
    budgetObjectStore.add(record)
}

function uploadBudget() {
    const transaction = db.transaction(['new_budget'], 'readwrite')
    const budgetObjectStore = transaction.objectStore('new_budget')
    const getAll = budgetObjectStore.getAll()

    getAll.onsuccess = function() {
        //send indexedDb data store to server
        if(getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
            })
                .then((response) => response.json())
                .then((serverResponse) => {
                    if(serverResponse.message) {
                        throw new Error(serverResponse)
                    }
                    const transaction = db.transaction(['new_budget'], 'readwrite')
                    const budgetObjectStore = transaction.objectStore('new_budget')
                    budgetObjectStore.clear()

                    alert('Budget Information Submitted!')
                })
                .catch((err) => {
                    console.log(err)
                })
        }
    }
}

window.addEventListener('online', uploadBudget)