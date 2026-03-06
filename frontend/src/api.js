const API = "http://localhost:3000";

export const getInfoProceso = () => fetch(`${API}/api/info-proceso`).then(r => r.json());
export const getOpciones = () => fetch(`${API}/api/opciones`).then(r => r.json());
export const getDocumentos = () => fetch(`${API}/api/documentos-proceso`).then(r => r.json());
export const getResultados = () => fetch(`${API}/api/resultados`).then(r => r.json());
export const urlDocumento = (nombre) => `${API}/api/documento-proceso/${encodeURIComponent(nombre)}`;

export const verificarCedula = (cedula) =>
    fetch(`${API}/api/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula })
    }).then(r => r.json());

export const verificarPin = (cedula, pin) =>
    fetch(`${API}/api/verificar-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, pin })
    }).then(r => r.json());

export const votar = (cedula, opcion) =>
    fetch(`${API}/api/votar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, candidato: opcion })
    }).then(r => r.json());

export const abstenerse = (cedula) =>
    fetch(`${API}/api/abstenerse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula })
    }).then(r => r.json());

export const crearProceso = (datos, pdfs) => {
    const formData = new FormData();
    formData.append("datos", JSON.stringify(datos));
    pdfs.forEach(f => formData.append("pdfs", f));
    return fetch(`${API}/api/crear-proceso`, { method: "POST", body: formData }).then(r => r.json());
};

export const subirPadron = (archivo) => {
    const formData = new FormData();
    formData.append("padron", archivo);
    return fetch(`${API}/api/subir-padron`, { method: "POST", body: formData }).then(r => r.json());
};

export const loginAdmin = (password) =>
    fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
    }).then(r => r.json());