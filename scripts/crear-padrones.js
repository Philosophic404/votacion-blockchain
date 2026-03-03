const XLSX = require("xlsx");

const registroCivil = [
    { Cédula: "1719022541", Nombre: "Ana Lucía Méndez", Fecha_nacimiento: "1985-03-12", Provincia: "Pichincha", Cantón: "Quito", Estado: "activo" },
    { Cédula: "1710468263", Nombre: "Carlos Vera Solís", Fecha_nacimiento: "1978-07-24", Provincia: "Guayas", Cantón: "Guayaquil", Estado: "activo" },
    { Cédula: "1715780241", Nombre: "María José Ramos", Fecha_nacimiento: "1990-11-05", Provincia: "Azuay", Cantón: "Cuenca", Estado: "activo" },
    { Cédula: "1701713123", Nombre: "Pedro Alvarado", Fecha_nacimiento: "1965-02-18", Provincia: "Manabí", Cantón: "Portoviejo", Estado: "fallecido" },
    { Cédula: "1723456789", Nombre: "Lucía Torres", Fecha_nacimiento: "1992-08-30", Provincia: "Pichincha", Cantón: "Quito", Estado: "activo" },
];

const cne = [
    { Cédula: "1719022541", Nombre: "Ana Lucía Méndez", Fecha_nacimiento: "1985-03-12", Provincia: "Pichincha", Cantón: "Quito", Estado: "habilitado" },
    { Cédula: "1710468263", Nombre: "Carlos Vera Solís", Fecha_nacimiento: "1978-07-24", Provincia: "Guayas", Cantón: "Guayaquil", Estado: "habilitado" },
    { Cédula: "1715780241", Nombre: "María José Ramos", Fecha_nacimiento: "1990-11-05", Provincia: "Azuay", Cantón: "Cuenca", Estado: "habilitado" },
    { Cédula: "1701713123", Nombre: "Pedro Alvarado", Fecha_nacimiento: "1965-02-18", Provincia: "Manabí", Cantón: "Portoviejo", Estado: "inhabilitado" },
    { Cédula: "1723456789", Nombre: "Lucía Torres", Fecha_nacimiento: "1992-08-30", Provincia: "Pichincha", Cantón: "Quito", Estado: "habilitado" },
];

const partido = [
    { Cédula: "1719022541", Nombre: "Ana Lucía Méndez", Fecha_nacimiento: "1985-03-12", Provincia: "Pichincha", Cantón: "Quito", Fecha_afiliación: "2018-05-10", PIN: "371425" },
    { Cédula: "1710468263", Nombre: "Carlos Vera Solís", Fecha_nacimiento: "1978-07-24", Provincia: "Guayas", Cantón: "Guayaquil", Fecha_afiliación: "2019-01-15", PIN: "123456" },
    { Cédula: "1715780241", Nombre: "María José Ramos", Fecha_nacimiento: "1990-11-05", Provincia: "Azuay", Cantón: "Cuenca", Fecha_afiliación: "2020-03-22", PIN: "123456" },
    { Cédula: "1723456789", Nombre: "Lucía Torres", Fecha_nacimiento: "1992-08-30", Provincia: "Pichincha", Cantón: "Quito", Fecha_afiliación: "2021-07-04" },
];

function crearXLSX(datos, nombreArchivo) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, "Padrón");
    XLSX.writeFile(wb, `padrones/${nombreArchivo}`);
    console.log(`✓ Creado: padrones/${nombreArchivo}`);
}

const fs = require("fs");
if (!fs.existsSync("padrones")) fs.mkdirSync("padrones");

crearXLSX(registroCivil, "registro_civil.xlsx");
crearXLSX(cne, "cne.xlsx");
crearXLSX(partido, "partido.xlsx");

console.log("\n✓ Los tres padrones están listos en la carpeta /padrones");
console.log("  Puedes editarlos en OnlyOffice antes de cargarlos al contrato.");
