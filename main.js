/*
    Tak, wiem, ze kod jest turbo chujowy.
    Moze kiedys go naprawie, ale teraz mi sie nie chce.
    Napisalem to, bo nie chcialo mi sie co chwile odswiezac apki InPostu jak czekalem na Switcha.
    Jak masz jakies sugestie, to pisz na wykopie.
*/

var noStatuses = 0;
var parcelNo = '';
const interval = 10000;
const statusTableId = 'main';
const alertId = 'alert';
const countId = 'count';
var intervalHandle;
var statusIntervalHandle;
var lastStatusCheck;
var audio = new Audio('alert.mp3');
audio.loop = true;

const setTitle = title => {
    document.title = title;
}

const setParcelNo = (el, id = '') => {
    const v = id == '' ? el.value : id;
    clearInterval(intervalHandle);
    noStatuses = 0;
    if(v != '') {
        parcelNo = v;
        intervalHandle = setInterval(tick, interval);
        tick();
    }
}

const clearStatusTable = () => {
    for(var i of document.getElementById(statusTableId).children) {
        i.remove();
    }
}

const statusAlert = () => {
    audio.play();
    document.getElementById(alertId).style.display = "block";
    const _ = () => {
        setTitle("NOWY STATUS!!!!");
        setTimeout(() => {
            setTitle("InPost Monitor")
        }, 1000);
    }
    _();
    statusIntervalHandle = setInterval(_, 2000)
}

const clearStatusAlert = () => {
    audio.pause();
    clearInterval(statusIntervalHandle);
    setTitle("InPost Monitor");
    document.getElementById(alertId).style.display = "none";
}

const fillStatusTable = data => {
    data = data.tracking_details
    const table = document.createElement("table");
    if(data.length > noStatuses && noStatuses != 0) {
        statusAlert();
    }
    for(var i of data) {
        const tr = document.createElement("tr");
        const fields = ['datetime', 'status'];
        for(var field of fields) {
            const td = document.createElement('td');
            if(field == 'datetime')
                i[field] = new Date(i[field]).toLocaleString();
            if(field == 'status') {
                tr.title = i[field];
                i[field] = resolveStatus(i[field])
            }
            td.innerText = i[field];
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    noStatuses = data.length;
    lastStatusCheck = new Date();
    document.getElementById(countId).innerText = `Ostatnio sprawdzony ${new Date().toLocaleTimeString()}`
    document.getElementById(statusTableId).appendChild(table);
}

const getPostData = parcelNo => new Promise((resolve, reject) => {
    if(parcelNo.length == 0) {
        reject();
        return;
    }

    const baseUrl = 'https://api-shipx-pl.easypack24.net/v1/tracking';
    const url = `${baseUrl}/${parcelNo}?${new Date().getTime()}`;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.send();
    xhr.onreadystatechange = (data, err) => {
        if (xhr.status == 200) {
            if(xhr.response.length > 0)
                resolve(JSON.parse(xhr.responseText));
        } else {
            console.error(`Error ${xhr.status}: ${xhr.statusText}`);
            reject(xhr.status);
        }
    }
});

const tick = async () => {
    if(parcelNo != '') {
        var data;
        try {
            data = await getPostData(parcelNo);
        }catch(e) {
            console.error(`getPostData caught exception`);
            return;
        }

        clearStatusTable();
        fillStatusTable(data);
    }
}

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    setParcelNo(null, urlParams.get('id'));
    setTitle('InPost Monitor')
}