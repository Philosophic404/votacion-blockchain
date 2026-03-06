import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import "./index.css"
import Votacion from "./pages/Votacion"
import Admin from "./pages/Admin"

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Votacion />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
)