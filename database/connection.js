const mongoose = require("mongoose")

const connection = async() => {

    try {
        await mongoose.connect("mongodb://0.0.0.0:27017/mi_red_social")

        console.log("Conectado correctamente a la base de datos")

    } catch (error) {
        console.log(error)
        throw new Error("No se ha podido conectar a la base de datos")
    }

}

module.exports = connection