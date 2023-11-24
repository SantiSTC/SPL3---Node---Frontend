"use strict";
const express = require('express');
const app = express();
app.set('puerto', 2023);
//#region Configuraciones
const fs = require('fs');
app.use(express.json());
const jwt = require("jsonwebtoken");
app.set("key_jwt", "Iannello.Santiago");
app.use(express.urlencoded({ extended: false }));
const multer = require('multer');
const mime = require('mime-types');
const storage = multer.diskStorage({
    destination: "public/fotos/",
});
const upload = multer({
    storage: storage
});
const cors = require("cors");
app.use(cors());
app.use(express.static("public"));
const mysql = require('mysql');
const myconn = require('express-myconnection');
const db_options = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'jugueteria_bd'
};
app.use(myconn(mysql, db_options, 'single'));
//#endregion
//##############################################################################################//
//RUTAS PARA LOS MIDDLEWARES DEL JWT
//##############################################################################################//
//#region verificar_usuario
const verificar_usuario = express.Router();
verificar_usuario.use((request, response, next) => {
    let obj = request.body;
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        conn.query("select * from usuarios where correo = ? and clave = ? ", [obj.correo, obj.clave], (err, rows) => {
            if (err)
                throw ("Error en consulta de base de datos.");
            if (rows.length == 1) {
                response.obj_usuario = rows[0];
                next();
            }
            else {
                response.status(200).json({
                    exito: false,
                    mensaje: "Correo y/o Clave incorrectos.",
                    jwt: null
                });
            }
        });
    });
});
//#endregion
//#region MW verificar_jwt
//SE GENERA RUTA PARA EL MW
const verificar_jwt = express.Router();
verificar_jwt.use((request, response, next) => {
    let token = request.headers["authorization"];
    if (!token) {
        response.status(401).send({
            error: "El JWT es requerido!!!"
        });
        return;
    }
    if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length);
    }
    if (token) {
        jwt.verify(token, app.get("key_jwt"), (error, decoded) => {
            if (error) {
                return response.json({
                    exito: false,
                    status: 403,
                    mensaje: "El JWT NO es válido!!!"
                });
            }
            else {
                response.jwt = decoded;
                next();
            }
        });
    }
    else {
        response.status(401).send({
            error: "El JWT está vacío!!!"
        });
    }
});
//#endregion
//##############################################################################################//
//RUTAS PARA LOS MIDDLEWARES DEL JWT
//##############################################################################################//
//#region login POST
app.post("/login", verificar_usuario, (request, response, obj) => {
    const user = response.obj_usuario;
    const payload = {
        usuario: {
            Correo: user.correo,
            Clave: user.clave,
            Nombre: user.nombre,
            Apellido: user.apellido,
            Foto: user.foto,
            Perfil: user.perfil
        },
        alumno: {
            Nombre: "Santiago",
            Apellido: "Iannello",
        },
        dni_alumno: {
            Dni: "44195364"
        },
        api: "productos_usuarios API",
        version: "1.0.1"
    };
    const token = jwt.sign(payload, app.get("key_jwt"), {
        expiresIn: "2m"
    });
    response.json({
        exito: true,
        status: 200,
        mensaje: "JWT creado!!!",
        jwt: token
    });
});
//#endregion
//#region login GET
app.get("/login", verificar_jwt, (request, response, obj) => {
    const user = response.obj_usuario;
    const jwt_info = response.jwt;
    response.json({
        exito: true,
        status: 200,
        mensaje: "JWT creado.",
        payload: jwt_info,
    });
});
//#endregion
//#region login GET
//##############################################################################################//
// CRUD BD
//##############################################################################################//
app.post("/agregarJugueteBD", verificar_jwt, upload.single("foto"), (request, response) => {
    let file = request.file;
    let extension = mime.extension(file.mimetype);
    let juguete = JSON.parse(request.body.juguete_json);
    let path = file.destination + juguete.marca + "." + extension;
    fs.renameSync(file.path, path);
    juguete.path_foto = path.split("public/")[1];
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        conn.query("insert into juguetes set ?", [juguete], (err, rows) => {
            if (err) {
                console.log(err);
                throw ("Error en consulta de base de datos.");
            }
            response.json({
                exito: true,
                mensaje: "Juguete agregado a la bd.",
            });
        });
    });
});
app.get('/listarJuguetesBD', verificar_jwt, (request, response) => {
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        conn.query("select * from juguetes", (err, rows) => {
            if (err)
                throw ("Error en consulta de base de datos.");
            response.send(JSON.stringify(rows));
        });
    });
});
app.delete('/toys', (request, response) => {
    let juguete = request.body;
    let path_foto = "public/";
    let hay_registro = false;
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        conn.query("select path_foto from juguetes where id = ?", [juguete.id_juguete], (err, result) => {
            if (err)
                throw ("Error en consulta de base de datos.");
            if (result.length > 0) {
                path_foto += result[0].path_foto;
                hay_registro = true;
            }
            if (hay_registro) {
                request.getConnection((err, conn) => {
                    if (err)
                        throw ("Error al conectarse a la base de datos.");
                    conn.query("delete from juguetes where id = ?", [juguete.id_juguete], (err, rows) => {
                        if (err) {
                            console.log(err);
                            throw ("Error en consulta de base de datos.");
                        }
                        borrarFoto(path_foto);
                        response.json({
                            exito: true,
                            mensaje: "Juguete eliminado de la bd.",
                        });
                    });
                });
            }
            else {
                response.json({
                    exito: false,
                    mensaje: "Juguete NO eliminado de la bd.",
                });
            }
        });
    });
});
app.post('/toys', upload.single("foto"), (request, response) => {
    let file = request.file;
    let extension = mime.extension(file.mimetype);
    let juguete = JSON.parse(request.body.juguete);
    let path = file.destination + juguete.marca + "." + extension;
    fs.renameSync(file.path, path);
    juguete.path = path.split("public/")[1];
    let juguete_modif = {};
    //para excluir la pk (codigo)
    juguete_modif.marca = juguete.marca;
    juguete_modif.precio = juguete.precio;
    juguete_modif.path_foto = juguete.path;
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        conn.query("update juguetes set ? where id = ?", [juguete_modif, juguete.id_juguete], (err, rows) => {
            if (err) {
                console.log(err);
                throw ("Error en consulta de base de datos.");
            }
            let hay_registro = rows.affectedRows == 0 ? false : true;
            if (!hay_registro) {
                borrarFoto("public/" + juguete.path);
            }
            response.json({
                exito: hay_registro,
                mensaje: hay_registro ? "Juguete modificado en la bd." : "Juguete NO modificado en la bd.",
            });
        });
    });
});
//#endregion
//#region FUNCIONES
function borrarFoto(path_foto) {
    let borrado = true;
    fs.unlink(path_foto, (err) => {
        if (err) {
            console.log(err);
            borrado = false;
        }
        else {
            console.log(path_foto + ' fue borrado.');
        }
    });
    return borrado;
}
//#endregion
// IMPORTANTE
app.listen(app.get('puerto'), () => {
    console.log('Servidor corriendo sobre puerto:', app.get('puerto'));
});
//# sourceMappingURL=servidor_node.js.map