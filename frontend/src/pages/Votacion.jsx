import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
    getInfoProceso, getOpciones, getDocumentos,
    getResultados, urlDocumento, verificarCedula,
    verificarPin, votar, abstenerse
} from "../api";

export default function Votacion() {
    const [info, setInfo] = useState(null);
    const [opciones, setOpciones] = useState([]);
    const [documentos, setDocumentos] = useState([]);
    const [paso, setPaso] = useState(1);
    const [cedula, setCedula] = useState("");
    const [pin, setPin] = useState("");
    const [opcionSeleccionada, setOpcionSeleccionada] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [votoEmitido, setVotoEmitido] = useState(false);
    const [resultados, setResultados] = useState([]);
    const [ahora, setAhora] = useState(Math.floor(Date.now() / 1000));
    const [countdown, setCountdown] = useState({});

    useEffect(() => {
        cargarDatos();
        const interval = setInterval(() => {
            setAhora(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (info) calcularCountdown();
    }, [ahora, info]);

    async function cargarDatos() {
        const [infoData, opcionesData, docsData] = await Promise.all([
            getInfoProceso(), getOpciones(), getDocumentos()
        ]);
        if (infoData.exito) setInfo(infoData);
        if (opcionesData.exito) setOpciones(opcionesData.opciones);
        if (docsData.exito) setDocumentos(docsData.documentos);
    }

    function calcularCountdown() {
        const diff = info.inicioVotacion - ahora;
        if (diff <= 0) return setCountdown(null);
        setCountdown({
            dias: String(Math.floor(diff / 86400)).padStart(2, "0"),
            horas: String(Math.floor((diff % 86400) / 3600)).padStart(2, "0"),
            mins: String(Math.floor((diff % 3600) / 60)).padStart(2, "0"),
            segs: String(diff % 60).padStart(2, "0"),
        });
    }

    const enInscripcion = info && ahora < info.inicioVotacion;
    const enVotacion = info && ahora >= info.inicioVotacion && ahora <= info.finVotacion && !info.cerrado;
    const cerrado = info && (info.cerrado || ahora > info.finVotacion);

    function formatFecha(ts) {
        return new Date(ts * 1000).toLocaleString("es-EC", {
            dateStyle: "short", timeStyle: "short"
        });
    }

    async function handleCedula() {
        if (!cedula.trim()) return setError("Ingresa tu número de cédula.");
        setCargando(true); setError("");
        const data = await verificarCedula(cedula.trim());
        setCargando(false);
        if (data.exito) { setPaso(2); }
        else setError(data.mensaje || "Cédula no válida.");
    }

    async function handlePin() {
        if (!pin.trim()) return setError("Ingresa tu PIN.");
        setCargando(true); setError("");
        const data = await verificarPin(cedula.trim(), pin.trim());
        setCargando(false);
        if (data.exito) { setPaso(3); }
        else setError(data.mensaje || "PIN incorrecto.");
    }

    async function handleVotar() {
        if (!opcionSeleccionada) return setError("Selecciona una opción.");
        if (!confirm("¿Confirmas tu voto? Esta acción es irreversible.")) return;
        setCargando(true); setError("");
        const data = await votar(cedula.trim(), opcionSeleccionada);
        setCargando(false);
        if (data.exito) {
            setMensaje("✓ Voto registrado en blockchain.");
            await cargarResultados();
            setVotoEmitido(true);
        } else setError(data.mensaje || "Error al registrar voto.");
    }

    async function handleAbstenerse() {
        if (!confirm("¿Confirmas tu abstención? Se registrará en blockchain.")) return;
        setCargando(true); setError("");
        const data = await abstenerse(cedula.trim());
        setCargando(false);
        if (data.exito) {
            setMensaje("✓ Abstención registrada en blockchain.");
            await cargarResultados();
            setVotoEmitido(true);
        } else setError(data.mensaje || "Error al registrar abstención.");
    }

    async function cargarResultados() {
        const data = await getResultados();
        if (data.exito) setResultados(data.resultados);
    }

    const panelIzquierdo = (
        <div className="flex flex-col gap-6">
            {/* Info del proceso */}
            <div className="bg-white border border-gray-200 rounded-sm p-6">
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                    {info?.tipo?.replace("_", " ") || "Proceso electoral"}
                </div>
                <h2 className="text-2xl font-semibold mb-1">{info?.titulo}</h2>
                {info?.descripcion && (
                    <p className="text-sm text-gray-500 mt-2 mb-4">{info.descripcion}</p>
                )}
                <hr className="border-gray-100 my-4" />
                <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Inicio votación</span>
                        <span className="font-mono text-xs">{info && formatFecha(info.inicioVotacion)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Fin votación</span>
                        <span className="font-mono text-xs">{info && formatFecha(info.finVotacion)}</span>
                    </div>
                </div>
            </div>

            {/* Countdown */}
            {enInscripcion && countdown && (
                <div className="bg-black text-white rounded-sm p-6 text-center">
                    <div className="text-xs uppercase tracking-widest text-gray-400 mb-4">
                        La votación abre en
                    </div>
                    <div className="flex justify-center gap-6">
                        {[["días", countdown.dias], ["horas", countdown.horas], ["min", countdown.mins], ["seg", countdown.segs]].map(([label, val]) => (
                            <div key={label} className="flex flex-col items-center">
                                <span className="text-3xl font-bold tabular-nums">{val}</span>
                                <span className="text-xs text-gray-400 uppercase mt-1">{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="text-xs text-gray-400 mt-4">Usa este tiempo para leer el material informativo</div>
                </div>
            )}

            {/* Documentos */}
            {documentos.length > 0 && (
                <div className="flex flex-col gap-2">
                    {documentos.map((nombre) => (
                        <div key={nombre} className="bg-white border border-gray-200 rounded-sm p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📄</span>
                                <div>
                                    <div className="text-sm font-medium">{nombre}</div>
                                    <div className="text-xs text-gray-400">Material informativo · PDF</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a href={urlDocumento(nombre)} target="_blank" rel="noreferrer"
                                    className="text-xs border border-gray-300 px-3 py-1 rounded-sm hover:bg-gray-50">
                                    ↗ Ver
                                </a>
                                <a href={urlDocumento(nombre)} download={nombre}
                                    className="text-xs bg-black text-white px-3 py-1 rounded-sm hover:bg-gray-800">
                                    ↓ Descargar
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {documentos.length === 0 && (
                <p className="text-xs text-gray-400">No hay documentos adjuntos para este proceso.</p>
            )}
        </div>
    );

    const panelDerecho = () => {
        if (!info) return <div className="text-gray-400 text-sm">Cargando...</div>;

        if (votoEmitido) return (
            <div className="bg-white border border-gray-200 rounded-sm p-8 flex flex-col gap-6">
                <div className="text-center">
                    <div className="text-4xl mb-3">✓</div>
                    <div className="font-semibold text-lg">{mensaje}</div>
                    <div className="text-xs text-gray-400 mt-2">Tu participación quedó registrada en la blockchain.</div>
                </div>
                {resultados.length > 0 && (
                    <div className="flex flex-col gap-3 mt-4">
                        <div className="text-xs uppercase tracking-widest text-gray-400">Resultados parciales</div>
                        {resultados.map((r) => (
                            <div key={r.candidato} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                <span className="text-sm">{r.candidato}</span>
                                <span className="font-bold tabular-nums">{r.votos}</span>
                            </div>
                        ))}
                        <div className="text-xs text-gray-400 mt-2">
                            Participantes: {info.totalParticipantes} · Abstenciones: {info.totalAbstenciones}
                        </div>
                    </div>
                )}
                <div className="text-xs text-gray-400 text-center">
                    Para votar con otra cédula recarga la página.
                </div>
            </div>
        );

        if (enInscripcion) return (
            <div className="bg-white border border-gray-200 rounded-sm p-8 text-center flex flex-col items-center gap-4">
                <span className="text-4xl">🗓️</span>
                <div className="font-semibold text-lg">Período de inscripción</div>
                <p className="text-sm text-gray-500">La votación aún no ha comenzado. Aprovecha este tiempo para revisar el material informativo en el panel izquierdo.</p>
            </div>
        );

        if (cerrado) return (
            <div className="bg-white border border-gray-200 rounded-sm p-8 text-center flex flex-col items-center gap-4">
                <span className="text-4xl">🔒</span>
                <div className="font-semibold text-lg">Votación cerrada</div>
                <p className="text-sm text-gray-500">Este proceso electoral ha concluido.</p>
            </div>
        );

        return (
            <div className="bg-white border border-gray-200 rounded-sm p-8 flex flex-col gap-6">
                {/* Paso 1 */}
                {paso === 1 && (
                    <div className="flex flex-col gap-4">
                        <div className="font-semibold text-lg">Paso 1 — Ingresa tu cédula</div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">Número de cédula</label>
                            <input
                                className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black"
                                placeholder="1712345678"
                                value={cedula}
                                onChange={e => setCedula(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleCedula()}
                            />
                        </div>
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <button
                            onClick={handleCedula}
                            disabled={cargando}
                            className="w-full bg-black text-white py-3 rounded-sm text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                            {cargando ? "Verificando..." : "Continuar"}
                        </button>
                    </div>
                )}

                {/* Paso 2 */}
                {paso === 2 && (
                    <div className="flex flex-col gap-4">
                        <div className="font-semibold text-lg">Paso 2 — Ingresa tu PIN</div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">PIN de votación</label>
                            <input
                                type="password"
                                className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-black"
                                placeholder="••••••"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handlePin()}
                            />
                        </div>
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <button
                            onClick={handlePin}
                            disabled={cargando}
                            className="w-full bg-black text-white py-3 rounded-sm text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                            {cargando ? "Verificando..." : "Continuar"}
                        </button>
                        <button onClick={() => { setPaso(1); setError(""); }}
                            className="text-xs text-gray-400 hover:text-black">
                            ← Volver
                        </button>
                    </div>
                )}

                {/* Paso 3 */}
                {paso === 3 && (
                    <div className="flex flex-col gap-4">
                        <div className="font-semibold text-lg">Paso 3 — Emite tu voto</div>
                        <div className="flex flex-col gap-2">
                            {opciones.map((op) => (
                                <button
                                    key={op}
                                    onClick={() => setOpcionSeleccionada(op)}
                                    className={`w-full text-left px-4 py-3 border rounded-sm text-sm transition-all ${
                                        opcionSeleccionada === op
                                            ? "border-black bg-black text-white"
                                            : "border-gray-200 hover:border-gray-400"
                                    }`}>
                                    {op}
                                </button>
                            ))}
                        </div>
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <button
                            onClick={handleVotar}
                            disabled={cargando || !opcionSeleccionada}
                            className="w-full bg-black text-white py-3 rounded-sm text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                            {cargando ? "Registrando..." : "Registrar voto en blockchain"}
                        </button>
                        <button
                            onClick={handleAbstenerse}
                            disabled={cargando}
                            className="w-full border border-gray-300 py-3 rounded-sm text-sm text-gray-500 hover:border-gray-500 disabled:opacity-50">
                            Abstenerme
                        </button>
                        <button onClick={() => { setPaso(2); setError(""); }}
                            className="text-xs text-gray-400 hover:text-black">
                            ← Volver
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f5f4f0]">
            <Navbar />
            <div className="max-w-6xl mx-auto px-8 py-12">
                <div className="mb-10">
                    <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Sistema Electoral</div>
                    <h1 className="text-5xl font-bold leading-tight">
                        Democracia <span className="italic text-[#c0392b] font-serif">real</span> en cadena
                    </h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>{panelIzquierdo}</div>
                    <div>{panelDerecho()}</div>
                </div>
            </div>
        </div>
    );
}