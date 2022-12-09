// Importar modelo
const Follow = require("../models/follow")
const User = require("../models/user")

// Configurar acciones de prueba
const pruebaFollow = (req,res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    })
}

// Acción de guardar un follow (acción seguir)
const save = (req, res) => {

    // Conseguir datos por body
    const params = req.body

    // Sacar id del usuario identificado
    const identity = req.user

    // Crear objeto con modelo follow
    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed
    })

    // Guardar objeto en bbdd
    userToFollow.save((error, followStored) => {

        if(error | !followStored){
            return res.status(500).send({
                status: "error",
                message: "No se ha podido seguir al usuario"
            })
        }

        return res.status(200).send({
            status: "success",
            identity: req.user,
            follow: followStored
        })
    })
}


// Acción de borrar un follow (acción dejar de seguir)
const unfollow = (req, res) => {

    // Recoger el id del usuario identificado
    const userId = req.user.id

    // Recoger el id del usuario que sigo y quiero dejar de seguir
    const followedId = req.params.id

    // Find de las coincidencias y hacer remove
    Follow.find({
        "user": userId,
        "followed": followedId
    }).remove((error, followDeleted) => {
        if(error || !followDeleted){
            return res.status(500).send({
                status: "error",
                message: "No has dejado de seguir a nadie"
            })
        }

        return res.status(200).send({
            status: "success",
            identity: req.user,
            followDeleted
        })
    })

    
}


// Acción de listado de usuarios que estoy siguiente


// Acción listado de usuarios que me siguen

// Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    unfollow
}