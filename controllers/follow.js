// Configurar acciones de prueba
const pruebaFollow = (req,res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    })
}

// Exportar acciones
module.exports = {
    pruebaFollow
}