// Importar dependencias y módulos
const bcrypt = require("bcrypt")

// Importar modelos
const User = require("../models/user")

// Importar servicios
const jwt = require("../services/jwt")

// Configurar acciones de prueba
const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js",
        usuario: req.user
    })
}

// Registro de usuarios
const register = (req, res) => {
    // Recoger datos de la petición
    let params = req.body

    // Comprobar que me lleguen bien (+ validación)
    if(!params.name || !params.email || !params.password || !params.nick){
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar"
        })
    }

    // Control usuarios duplicados
    User.find({ $or: [
        {email: params.email.toLowerCase()},
        {nick: params.nick.toLowerCase()}
    ]}).exec(async(error, users) => {

        if(error) return res.status(500).json({status: "error", message: "Error en la consulta de usuarios"})

        if(users && users.length >= 1){
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            })
        }
        
        // Cifrar la contraseña
        let pwd = await bcrypt.hash(params.password, 10)
        params.password = pwd

        // Crear objeto de usuario 
        let user_to_save = new User(params)

        // Guardar usuario en la bbdd
        user_to_save.save((error, userStored) => {
            if(error || !userStored) return res.status(500).send({status: "error", message: "Error al guardar el usuario"})

           
            // Devolver resultado
            return res.status(200).json({
                status: "success",
                message: "Usuario registrado correctamente",
                user: userStored
            }) 
        })
    })
}

const login = (req, res) => {
    // Recoger parámetros body
    let params = req.body

    if(!params.email || !params.password){
        return res.status(400).send({
            status: "error",
            message: "Faltan datos por enviar",
            user: userStored
        }) 
    }

    // Buscar en la bbdd si existe
    User.findOne({email: params.email})
        // .select({"password": 0})
        .exec((error, user) => {
        if(error || !user) return res.status(404).send({status: "error", message: "No existe el usuario"})
    
        // Comprobar su contraseña
        const pwd = bcrypt.compareSync(params.password, user.password) 
        // comparo la que le mando con la que tengo guardada que está cifrada
        
        if(!pwd){
            return res.status(400).send({
                status: "error", 
                message: "No te has indentificado correctamente"
            })
        }

        // Conseguir Token
        const token = jwt.createToken(user)

        // Devolver datos del usuario
        return res.status(200).send({
            status: "success",
            message: "Te has identificado correctamente",
            user: {
                id: user._id,
                name: user.name,
                nick: user.nick
            },
            token
        })
    })  
}

const profile = (req, res) => {
    // Recibir el parámetro del id del usuario por la url
    const id = req.params.id

    // Consulta para sacar los datos del usuario
    User.findById(id)
        .select({password: 0, role: 0}) // Estos dos campos no los quiero mostrar
        .exec((error, userProfile) => {
        if(error || !userProfile){
            return res.status(404).send({
                status: "error", 
                message: "El usuario no existe o hay un error"
            })
        }

        // Devolver el resultado
        // Posteriormente devolver información de follows
        return res.status(200).send({
            status: "success",
            user: userProfile
        })
    })
}

const list = (req, res) => {
    // Controlar en qué página estamos

    // Consulta con mongoose paginate

    // Devolver el resultado
    return res.status(200).send({
        status: "success",
        message: "rurta"
    })
}

// Exportar acciones
module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list
}