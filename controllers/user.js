// Importar dependencias y módulos
const bcrypt = require("bcrypt")
const mongoosePagination = require("mongoose-pagination")
const fs = require("fs")
const path = require("path")

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
    let page = 1 // por defecto será la página 1
    if(req.params.page){
        page = req.params.page // a no ser que le pasemos una página como parámetro
    }
    page = parseInt(page)

    // Consulta con mongoose paginate
    let itemsPerPage = 5;
    User.find().sort('_id').paginate(page, itemsPerPage, (error, users, total) => {
        
        if(error || !users){
            return res.status(404).send({
                status: "error",
                message: "No hay usuarios disponibles",
                error
            })
        }
        // Devolver el resultado (posteriormente info follow)
        return res.status(200).send({
            status: "success",
            page,
            itemsPerPage,
            total,
            users,
            pages: Math.ceil(total/itemsPerPage)
        })
        
    })

}

const update = (req, res) => {
    // Recoger info del usuario a actualizar
    let userIdentity = req.user
    let userToUpdate = req.body

    // Eliminar campos sobrantes
    delete userToUpdate.iat
    delete userToUpdate.exp
    delete userToUpdate.role
    delete userToUpdate.image

    // Comprobar si el usuario ya existe
    User.find({ $or: [
        {email: userToUpdate.email.toLowerCase()},
        {nick: userToUpdate.nick.toLowerCase()}
    ]}).exec(async(error, users) => {

        if(error) return res.status(500).json({status: "error", message: "Error en la consulta de usuarios"})

        let userIsset = false
        users.forEach(user => {
            if(user && user._id != userIdentity.id) 
                userIsset = true
        })
        
        if(userIsset){
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            })
        }
        
        // Cifrar la contraseña
        if(userToUpdate.password){
            let pwd = await bcrypt.hash(userToUpdate.password, 10)
            userToUpdate.password = pwd
        }

        // Buscar y actualizar
        try {
            let userUpdated = User.findByIdAndUpdate({_id: userIdentity.id}, userToUpdate, {new: true})

            if(!userUpdated){
                return res.status(400).json({status: "error", message: "Error al actualizar usuario"})
            }

            //Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Metodo de actualizar usuario",
                user: userUpdated
            })

        } catch (error) {
            return res.status(500).send({
                status: "error",
                message: "Error al actualizar"
            })
        }
        
    })
    
}

const upload = (req, res) => {

    // Recoger el fichero de imagen y comprobar que existe
    if(!req.file){
        return res.status(404).json({
            status: "error", 
            message: "La petición no incluye la imagen"
        })
    }

    // Conseguir el nombre del archivo
    let image = req.file.originalname

    // Sacar la extensión del archivo
    const imageSplit = image.split("\.") // se va a convertir en un array
    const extension = imageSplit[1]

    // Comprobar extensión
    if(extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif"){
        // Eliminar el archivo que no cumpla la extensión
        const filePath = req.file.path
        const fileDeleted = fs.unlinkSync(filePath)

        return res.status(400).send({
            status: "error",
            message: "extensión del fichero inválida"
        })
    }

    // Si es correcto, guardar imagen en la bbdd
    User.findOneAndUpdate({_id: req.user.id}, {image: req.file.filename}, {new: true}, (error, userUpdated) => {
        
        if(error || !userUpdated){
            return res.status(500).json({
                status: "error", 
                message: "Error en la subida del avatar"
            })
        }
        
        return res.status(200).send({
            status: "success",
            user: userUpdated,
            file: req.file,
        })
    })
}

const avatar = (req, res) => {

    // Sacar el parámetro de la url
    const file = req.params.file

    // Montar el path real de la imagen
    const filePath = "./uploads/avatars/"+file
    
    // Comprobar que existe
    fs.stat(filePath, (error, exists) => {
        if(!exists){
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen"
            })
        }

        // Devolver un file    
        return res.sendFile(path.resolve(filePath))
    })
}

// Exportar acciones
module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar
}