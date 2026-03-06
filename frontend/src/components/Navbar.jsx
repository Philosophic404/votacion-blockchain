export default function Navbar({ estado }) {
    return (
        <nav className="w-full border-b border-gray-200 bg-[#f5f4f0] px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">⚡</span>
                </div>
                <div>
                    <div className="font-semibold text-sm tracking-tight">VotoChain</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">Ecuador · Red Local</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                <span className="text-xs uppercase tracking-widest text-gray-500">
                    {estado || "RED ACT"}
                </span>
            </div>
        </nav>
    );
}