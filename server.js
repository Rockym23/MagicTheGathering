const cors = require("cors");
const express = require("express");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { obtenerTipoCambio } = require("./exchangeRates");



const app = express();
const PORT = 3000;

app.use(cors());

async function obtenerPrecioCarta(nombreCarta) {
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(nombreCarta)}&unique=prints`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.data || data.data.length == 0) {   
            console.error("No hay ediciones de esta carta");
            return [];
        }

        const cartasArray = data.data.map(carta => ({
            nombre: carta.name,
            edicion: carta.set_name,
            numero_collector: carta.collector_number,
            precio_usd: carta.prices.usd || "No disponible",
            precio_usd_foil: carta.prices.usd_foil || "No disponible"
        }));

        console.log(cartasArray); // Muestra el arreglo en la consola
        return cartasArray;


    }catch (error) {
        console.error("Error al obtener la carta:", error);
        return null;
    }
}

app.get("/precio/:nombre", async (req, res) => {
    const nombreCarta = req.params.nombre;
    
    try {
        //const tasaCambio = await obtenerTipoCambio();
        //const info = await obtenerPrecioCarta(nombreCarta);
        const [tasaCambio, info] = await Promise.all([
            obtenerTipoCambio(),
            obtenerPrecioCarta(nombreCarta)
        ]);
        console.log("Tasa de Cambio: " + tasaCambio);
        console.log("Info Carta: " + JSON.stringify(info));
        if (!tasaCambio || !info.precio_usd) {
            return res.status(500).json({ error: "No se pudo obtener la información" });
        }

        const precioMxn = info.precio_usd * tasaCambio;
        
        res.json({
            carta: nombreCarta,
            precio_usd: info.precio_usd,
            precio_mxn: precioMxn.toFixed(2),
            imagen : info.images
        });
    } catch (error) {
        res.status(500).json({ error: "Error al consultar la API." });
    }
});


async function obtenerPreciosPorEdicion(nombreCarta) {
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(nombreCarta)}&unique=prints`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.data || data.data.length == 0) {   
            console.error("No hay ediciones de esta carta");
            return [];
        }
        // Obtener la tasa de cambio para convertir precios a MXN
        const tasaCambio = await obtenerTipoCambio();
        if (!tasaCambio) {
            return { error: "Error al obtener el tipo de cambio." };
        }

        // Almacenar cada versión con el precio en MXN
        const cartasArray = data.data.map(carta => ({
            id: carta.id,
            nombre: carta.name,
            edicion: carta.set_name,
            numero_coleccion: carta.collector_number,
            borde: carta.border,
            idioma: carta.lang,
            imagen_normal: carta.image_uris.normal,
            precio_usd: carta.prices.usd || "No disponible",
            precio_usd_foil: carta.prices.usd_foil || "No disponible",
            precio_mxn: carta.prices.usd ? (carta.prices.usd * tasaCambio).toFixed(2) : "No disponible",
            precio_mxn_foil: carta.prices.usd_foil ? (carta.prices.usd_foil * tasaCambio).toFixed(2) : "No disponible"
        }));

        console.log(cartasArray); // Muestra el arreglo en la consola
        return cartasArray;


    }catch (error) {
        console.error("Error al obtener la carta:", error);
        return null;
    }
}


app.get("/precio/porediciones/:nombre", async (req, res) => {
    const nombreCarta = req.params.nombre;
    const precios = await obtenerPreciosPorEdicion(nombreCarta);
    res.json(precios);
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
