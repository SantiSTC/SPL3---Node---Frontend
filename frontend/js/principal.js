"use strict";
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
$(document).ready(function () {
    let jwt = localStorage.getItem('jwt');
    $.ajax({
        url: "http://localhost:2023/login",
        method: "GET",
        dataType: "json",
        data: {},
        headers: { 'Authorization': 'Bearer ' + jwt },
        async: true
    })
        .done((obj_rta) => {
        if (obj_rta.exito) {
            let app = obj_rta.payload.api;
            let version = obj_rta.payload.version;
            let usuario = obj_rta.payload.usuario;
            $("#nombre_usuario").html(usuario.Nombre);
        }
        else {
            alert(obj_rta.mensaje);
            setTimeout(() => {
                $(location).attr('href', URL_BASE + "login.html");
            }, 1500);
        }
    })
        .fail((jqXHR, textStatus, errorThrown) => {
        let retorno = JSON.parse(jqXHR.responseText);
        alert(retorno.mensaje);
    });
    // #region Listar
    $("#listado_juguetes").on("click", function () {
        ListarJuguetesBD();
    });
    function ListarJuguetesBD() {
        let jwt = localStorage.getItem('jwt');
        $.ajax({
            url: "http://localhost:2023/listarJuguetesBD",
            method: "GET",
            dataType: "json",
            data: {},
            headers: { 'Authorization': 'Bearer ' + jwt },
            async: true
        })
            .done((obj_rta) => {
            if (obj_rta.exito == undefined) {
                let tabla = '<table class="table table-dark table-hover">';
                tabla += '<tr> <th>ID</th> <th>MARCA</th> <th>PRECIO</th> <th>FOTO</th> <th style="width:110px">ACCIONES</th> </tr>';
                if (obj_rta.length == 0) {
                    tabla += '<tr><td>---</td><td>---</td><td>---</td><td>---</td><th>---</td></tr>';
                }
                else {
                    obj_rta.forEach((toy) => {
                        tabla += "<tr>" +
                            "<td>" + toy.id + "</td>" +
                            "<td>" + toy.marca + "</td>" +
                            "<td>" + toy.precio + "</td>" +
                            "<td><img src='" + URL_API + toy.path_foto + "' width='50px' height='50px'></td>" +
                            "<td>" +
                            "<a href='#' class='btn btnModificar' data-action='modificar' data-obj_prod='" + JSON.stringify(toy) + "' title='Modificar' data-toggle='modal' data-target='#ventana_modal_prod'><span class='btnModificar'></span></a>" +
                            "<a href='#' class='btn btnEliminar' data-action='eliminar' data-obj_prod='" + JSON.stringify(toy) + "' title='Eliminar' data-toggle='modal' data-target='#ventana_modal_prod'><span class='btnEliimnar'></span></a>" +
                            "</td>" +
                            "</tr>";
                    });
                }
                tabla += "</table>";
                $("#divTablaIzq").html(tabla);
                $("[data-action='modificar']").on("click", function (e) {
                    e.preventDefault();
                    let objStr = $(this).attr("data-obj_prod");
                    let obj = JSON.parse(objStr);
                    let frm = MostrarForm("modificacion", obj);
                    $("#divTablaDer").html(frm);
                    Modificar();
                });
                $("[data-action='eliminar']").on("click", function (e) {
                    e.preventDefault();
                    let objStr = $(this).attr("data-obj_prod");
                    let obj = JSON.parse(objStr);
                    let frm = MostrarForm("baja", obj);
                    $("#divTablaDer").html(frm);
                    Eliminar();
                });
            }
            else {
                alert(obj_rta.mensaje);
                setTimeout(() => {
                    $(location).attr('href', URL_BASE + "login.html");
                }, 1000);
            }
        })
            .fail((jqXHR, textStatus, errorThrown) => {
            let retorno = JSON.parse(jqXHR.responseText);
            alert(retorno.mensaje);
        });
    }
    // #endregion
    // #region Alta
    $("#alta_juguete").on("click", function () {
        let formulario = MostrarForm("alta");
        $("#divTablaDer").html(formulario);
        $("#btnAceptar").on("click", function (e) {
            e.preventDefault();
            let jwt = localStorage.getItem('jwt');
            let marca = $("#marca").val();
            let precio = $("#precio").val();
            let foto = $("#foto")[0];
            let frm = new FormData();
            frm.append("juguete_json", JSON.stringify({ "marca": marca, "precio": precio }));
            frm.append("foto", foto.files[0]);
            $.ajax({
                type: 'POST',
                url: URL_API + "agregarJugueteBD",
                dataType: "json",
                data: frm,
                cache: false,
                processData: false,
                contentType: false,
                headers: { 'Authorization': 'Bearer ' + jwt },
                async: true
            })
                .done(function (obj_ret) {
                ListarJuguetesBD();
                console.log(obj_ret);
                alert(obj_ret.mensaje);
            })
                .fail((jqXHR, textStatus, errorThrown) => {
                ListarJuguetesBD();
                console.log("fail");
                let retorno = JSON.parse(jqXHR.responseText);
                alert(retorno.mensaje);
            });
        });
    });
    // #endregion
    // #region Eliminar
    function Eliminar() {
        $("#btnAceptar").on("click", function (e) {
            e.preventDefault();
            let id = $(this).data("id");
            let jwt = localStorage.getItem('jwt');
            let datos = {
                id_juguete: id
            };
            $.ajax({
                type: 'DELETE',
                url: URL_API + "toys",
                dataType: "application/x-www-form-urlencoded",
                data: datos,
                headers: { 'Authorization': 'Bearer ' + jwt },
                async: true
            })
                .done(function (obj_ret) {
                ListarJuguetesBD();
                console.log(obj_ret);
                alert(obj_ret.mensaje);
            })
                .fail((jqXHR, textStatus, errorThrown) => {
                ListarJuguetesBD();
                let retorno = JSON.parse(jqXHR.responseText);
                console.log("fail");
                alert(retorno.mensaje);
            });
        });
    }
    // #endregion
    // #region Modificar
    function Modificar() {
        $("#btnAceptar").on("click", function (e) {
            e.preventDefault();
            let jwt = localStorage.getItem('jwt');
            let id = $(this).data("id");
            let marca = $("#marca").val();
            let precio = $("#precio").val();
            let foto = $("#foto")[0];
            let frm = new FormData();
            frm.append("juguete", JSON.stringify({ "id_juguete": id, "marca": marca, "precio": precio }));
            frm.append("foto", foto.files[0]);
            $.ajax({
                type: 'POST',
                url: URL_API + "toys",
                dataType: "json",
                data: frm,
                cache: false,
                processData: false,
                contentType: false,
                headers: { 'Authorization': 'Bearer ' + jwt },
                async: true
            })
                .done(function (obj_ret) {
                ListarJuguetesBD();
                console.log(obj_ret);
                alert(obj_ret.mensaje);
            })
                .fail((jqXHR, textStatus, errorThrown) => {
                ListarJuguetesBD();
                let retorno = JSON.parse(jqXHR.responseText);
                alert(retorno.mensaje);
            });
        });
    }
    // #endregion
    // #region MostrarForm
    function MostrarForm(accion, obj_prod = null) {
        let encabezado = "";
        let solo_lectura = "";
        let solo_lectura_pk = "readonly";
        switch (accion) {
            case "alta":
                encabezado = 'AGREGAR PRODUCTO';
                solo_lectura_pk = "";
                break;
            case "baja":
                encabezado = 'ELIMINAR PRODUCTO';
                solo_lectura = "readonly";
                break;
            case "modificacion":
                encabezado = 'MODIFICAR PRODUCTO';
                break;
        }
        let id = "";
        let marca = "";
        let precio = "";
        let path = URL_BASE + "/img/producto_default.png";
        if (obj_prod !== null) {
            id = obj_prod.id;
            marca = obj_prod.marca;
            precio = obj_prod.precio;
            path = URL_API + obj_prod.path_foto;
        }
        let form = '<h3 style="padding-top:1em;">' + encabezado + '</h3>\
                            <div class="row justify-content-center">\
                                <div class="col-md-8">\
                                    <form class="was-validated">\
                                        <div class="form-group">\
                                            <label for="codigo">Marca:</label>\
                                            <input type="text" class="form-control" id="marca" placeholder="Ingresar marca"\
                                                value="' + marca + '" ' + solo_lectura + ' required>\
                                        </div>\
                                        <div class="form-group">\
                                            <label for="precio">Precio:</label>\
                                            <input type="number" class="form-control" id="precio" placeholder="Ingresar precio" name="precio"\
                                                value="' + precio + '" ' + solo_lectura + ' required>\
                                            <div class="valid-feedback">OK.</div>\
                                            <div class="invalid-feedback">Valor requerido.</div>\
                                        </div>\
                                        <div class="form-group">\
                                            <label for="foto">Foto:</label>\
                                            <input type="file" class="form-control" id="foto" name="foto" ' + solo_lectura + ' required>\
                                            <div class="valid-feedback">OK.</div>\
                                            <div class="invalid-feedback">Valor requerido.</div>\
                                        </div>\
                                        <div class="row justify-content-between"><img id="img_prod" src="' + path + '" width="400px" height="200px"></div><br>\
                                        <div class="row justify-content-between">\
                                            <input id="btnCerrar" type="button" class="btn btn-danger" data-dismiss="modal" value="Limpiar">\
                                            <button id="btnAceptar" data-id="' + id + '" type="submit" class="btn btn-primary" data-dismiss="modal">Aceptar</button>\
                                        </div>\
                                    </form>\
                                </div>\
                            </div>';
        return form;
    }
    // #endregion
    // #region Limpiar Formulario Derecha
    $("#divTablaDer").on("click", "#btnCerrar", function () {
        LimpiarFormularioDer();
    });
    $("#divTablaDer").on("click", "#btnCerrar", function () {
        OcultarForm();
    });
    function LimpiarFormularioDer() {
        $("#marca").val("");
        $("#precio").val("");
        $("#foto").val("");
        $("#img_prod").attr("src", "");
    }
    function OcultarForm() {
        console.log("Form oculto");
        $("#divTablaDer").html("<br><br>DERECHA");
    }
    // #endregion
});
//# sourceMappingURL=principal.js.map