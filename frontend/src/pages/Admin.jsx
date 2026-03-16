import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getInfoProceso, getResultados, loginAdmin, crearProceso, subirPadron } from "../api";

export default function Admin() {
    const [autenticado, setAutenticado] = useState(false);
    const [password, setPassword] = useState("");
    const [errorLogin, setErrorLogin] = useState("");
    const [info, setInfo] = useState(null);
    const [resultados, setResultados] = useState([]);
    const [tab, setTab] = useState("dashboard");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    // Formulario nuevo proceso
    const [titulo, setTitulo] = useState("");
    const [tipo, setTipo] = useState("consulta_sino");
    const [descripcion, setDescripcion] = useState("");
    const [opciones, setOpciones] = useState(["", ""]);
    const [inicioInscripcion, setInicioInscripcion] = useState("");
    const [finInscripcion, setFinInscripcion] = useState("");
    const [inicioVotacion, setInicioVotacion] = useState("");
    const [finVotacion, setFinVotacion] = useState("");
    const [pdfs, setPdfs] = useState([]);
    const [padron, setPadron] = useState(null);
    const [tipoPadron, setTipoPadron] = useState("partido");

    useEffect(() => {
        if (autenticado) cargarDatos();
    }, [autenticado]);

    async function cargarDatos() {
        const [infoData, resData] = await Promise.all([getInfoProceso(), getResultados()]);
        if (infoData.exito) setInfo(infoData);
        if (resData.exito) setResultados(resData.resultados);
    }

    async function handleLogin() {
        if (!password) return setErrorLogin("Ingresa la contraseña.");
        const data = await loginAdmin(password);
        if (data.exito) { setAutenticado(true); setErrorLogin(""); }
        else setErrorLogin("Contraseña incorrecta.");
    }

    async function handleCrearProceso() {
        if (!titulo.trim()) return setError("El título es obligatorio.");
        const ops = opciones.filter(o => o.trim());
        if (ops.length < 2) return setError("Agrega al menos 2 opciones.");
        if (!inicioVotacion || !finVotacion) return setError("Las fechas de votación son obligatorias.");

        setCargando(true); setError(""); setMensaje("");
        const datos = { titulo, tipo, descripcion, opciones: ops, inicioInscripcion, finInscripcion, inicioVotacion, finVotacion };
        const data = await crearProceso(datos, pdfs);
        setCargando(false);
        if (data.exito) {
            setMensaje("✓ " + data.mensaje);
            setTitulo(""); setDescripcion(""); setOpciones(["", ""]); setPdfs([]);
            setInicioInscripcion(""); setFinInscripcion(""); setInicioVotacion(""); setFinVotacion("");
            setTimeout(cargarDatos, 2000);
        } else setError("⚠ " + data.mensaje);
    }

    async function handleSubirPadron() {
        if (!padron) return setError("Selecciona un archivo xlsx.");
        setCargando(true); setError(""); setMensaje("");
        const data = await subirPadron(padron, tipoPadron);
        setCargando(false);
        if (data.exito) setMensaje("✓ Padrón cargado correctamente.");
        else setError("⚠ " + data.mensaje);
    }

    function agregarOpcion() { setOpciones([...opciones, ""]); }
    function actualizarOpcion(i, val) {
        const nuevas = [...opciones];
        nuevas[i] = val;
        setOpciones(nuevas);
    }
    function eliminarOpcion(i) {
        if (opciones.length <= 2) return;
        setOpciones(opciones.filter((_, idx) => idx !== i));
    }

    function formatFecha(ts) {
        if (!ts) return "—";
        return new Date(ts * 1000).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" });
    }

    if (!autenticado) return (
        <div className="min-h-screen bg-[#f5f4f0]">
            <Navbar />
            <div className="max-w-md mx-auto px-8 py-24">
                <div className="bg-white border border-gray-200 rounded-sm p-8 flex flex-col gap-6">
                    <div>
                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Panel de administración</div>
                        <div className="font-semibold text-xl">Acceso CNE</div>
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Contraseña</label>
                        <input
                            type="password"
                            className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleLogin()}
                        />
                    </div>
                    {errorLogin && <div className="text-red-500 text-sm">{errorLogin}</div>}
                    <button onClick={handleLogin}
                        className="w-full bg-black text-white py-3 rounded-sm text-sm font-medium hover:bg-gray-800">
                        Ingresar
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f5f4f0]">
            <Navbar />
            <div className="max-w-6xl mx-auto px-8 py-12">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Panel CNE</div>
                        <h1 className="text-3xl font-bold">Administración Electoral</h1>
                    </div>
                    <button onClick={() => setAutenticado(false)}
                        className="text-xs text-gray-400 hover:text-black border border-gray-200 px-4 py-2 rounded-sm">
                        Cerrar sesión
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 border-b border-gray-200">
                    {[["dashboard", "Dashboard"], ["proceso", "Nuevo proceso"], ["padron", "Padrón"]].map(([key, label]) => (
                        <button key={key} onClick={() => { setTab(key); setMensaje(""); setError(""); }}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
                                tab === key ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                            }`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Dashboard */}
                {tab === "dashboard" && (
                    <div className="flex flex-col gap-6">
                        {info ? (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        ["Proceso activo", info.titulo],
                                        ["Tipo", info.tipo?.replace("_", " ")],
                                        ["Participantes", info.totalParticipantes],
                                        ["Abstenciones", info.totalAbstenciones],
                                    ].map(([label, val]) => (
                                        <div key={label} className="bg-white border border-gray-200 rounded-sm p-5">
                                            <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">{label}</div>
                                            <div className="font-semibold text-lg truncate">{val}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border border-gray-200 rounded-sm p-5">
                                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Inicio votación</div>
                                        <div className="font-mono text-sm">{formatFecha(info.inicioVotacion)}</div>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-sm p-5">
                                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Fin votación</div>
                                        <div className="font-mono text-sm">{formatFecha(info.finVotacion)}</div>
                                    </div>
                                </div>
                                {resultados.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-sm p-6">
                                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-4">Resultados en tiempo real</div>
                                        <div className="flex flex-col gap-3">
                                            {resultados.map(r => {
                                                const total = resultados.reduce((a, b) => a + Number(b.votos), 0);
                                                const pct = total > 0 ? Math.round((Number(r.votos) / total) * 100) : 0;
                                                return (
                                                    <div key={r.candidato}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span>{r.candidato}</span>
                                                            <span className="font-bold">{r.votos} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                            <div className="bg-black h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-sm p-8 text-center text-gray-400">
                                No hay proceso activo.
                            </div>
                        )}
                        <button onClick={cargarDatos}
                            className="self-start text-xs border border-gray-200 px-4 py-2 rounded-sm hover:bg-gray-50">
                            ↻ Actualizar
                        </button>
                    </div>
                )}

                {/* Nuevo proceso */}
                {tab === "proceso" && (
                    <div className="bg-white border border-gray-200 rounded-sm p-8 flex flex-col gap-6 max-w-2xl">
                        <div className="font-semibold text-lg">Crear proceso electoral</div>

                        {mensaje && <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-sm px-4 py-3">{mensaje}</div>}
                        {error && <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-sm px-4 py-3">{error}</div>}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Título</label>
                                <input className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black"
                                    value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Ley de Aguas" />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Tipo</label>
                                <select className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black bg-white"
                                    value={tipo} onChange={e => setTipo(e.target.value)}>
                                    <option value="consulta_sino">Consulta Sí/No</option>
                                    <option value="eleccion">Elección interna</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Descripción</label>
                                <textarea className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
                                    rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)}
                                    placeholder="Describe el proceso electoral..." />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Opciones de voto</label>
                            <div className="flex flex-col gap-2">
                                {opciones.map((op, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input className="flex-1 border border-gray-200 rounded-sm px-4 py-2 text-sm focus:outline-none focus:border-black"
                                            value={op} onChange={e => actualizarOpcion(i, e.target.value)}
                                            placeholder={`Opción ${i + 1}`} />
                                        {opciones.length > 2 && (
                                            <button onClick={() => eliminarOpcion(i)}
                                                className="text-gray-400 hover:text-red-500 px-2 text-lg">×</button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={agregarOpcion}
                                    className="self-start text-xs text-gray-400 hover:text-black border border-dashed border-gray-300 px-4 py-2 rounded-sm">
                                    + Agregar opción
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Inicio inscripción</label>
                                <input type="datetime-local" className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black"
                                    value={inicioInscripcion} onChange={e => setInicioInscripcion(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Fin inscripción</label>
                                <input type="datetime-local" className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black"
                                    value={finInscripcion} onChange={e => setFinInscripcion(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Inicio votación *</label>
                                <input type="datetime-local" className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black"
                                    value={inicioVotacion} onChange={e => setInicioVotacion(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Fin votación *</label>
                                <input type="datetime-local" className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black"
                                    value={finVotacion} onChange={e => setFinVotacion(e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Documentos informativos (PDF)</label>
                            <input type="file" accept=".pdf" multiple
                                onChange={e => setPdfs(Array.from(e.target.files))}
                                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border file:border-gray-200 file:text-xs file:bg-white file:hover:bg-gray-50" />
                            {pdfs.length > 0 && (
                                <div className="mt-2 text-xs text-gray-400">
                                    {pdfs.map(f => f.name).join(", ")}
                                </div>
                            )}
                        </div>

                        <button onClick={handleCrearProceso} disabled={cargando}
                            className="w-full bg-black text-white py-3 rounded-sm text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                            {cargando ? "Desplegando contrato..." : "Crear proceso electoral"}
                        </button>
                    </div>
                )}

                {/* Padrón */}
                {tab === "padron" && (
                    <div className="bg-white border border-gray-200 rounded-sm p-8 flex flex-col gap-6 max-w-md">
                        <div className="font-semibold text-lg">Cargar padrón electoral</div>
                        {mensaje && <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-sm px-4 py-3">{mensaje}</div>}
                        {error && <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-sm px-4 py-3">{error}</div>}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Tipo de padrón</label>
                            <select
                                className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black bg-white"
                                value={tipoPadron} onChange={e => setTipoPadron(e.target.value)}>
                                <option value="partido">Padrón del partido</option>
                                <option value="civil">Registro Civil</option>
                                <option value="cne">CNE</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Archivo Excel (.xlsx)</label>
                            <input type="file" accept=".xlsx"
                                onChange={e => setPadron(e.target.files[0])}
                                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border file:border-gray-200 file:text-xs file:bg-white file:hover:bg-gray-50" />
                            {padron && <div className="mt-2 text-xs text-gray-400">✓ {padron.name}</div>}
                        </div>
                        <button onClick={handleSubirPadron} disabled={cargando}
                            className="w-full bg-black text-white py-3 rounded-sm text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                            {cargando ? "Subiendo..." : "Cargar padrón"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}