const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function obtenerTipoCambio() {
    const url = "https://mx.dolarapi.com/v1/cotizaciones/usd";
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.venta; // Retorna el valor del dólar en pesos
    } catch (error) {
        console.error("Error al obtener el tipo de cambio:", error);
        return null;
    }
}

module.exports = { obtenerTipoCambio };