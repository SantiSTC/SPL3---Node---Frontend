/// <reference path="../node_modules/@types/jquery/index.d.ts" />

$(document).ready(function() {
    $("#btnEnviar").on("click", function () {
        let correo = $("#correo").val();
        let clave = $("#clave").val();
        
        $.ajax({
            url: "http://localhost:2023/login",
            method: "POST",
            dataType: "json",
            data: { correo: correo, clave: clave },
        })
        .done(function (data) {
            if (data.exito) {
                localStorage.setItem("jwt", data.jwt);
                window.location.href = "principal.html";
            } else {
                console.error("Error en el login: ", data.mensaje);
                alert("Error en el login: " + data.mensaje);
            }
        })
        .fail(function(error){
            console.error("Error en el ajax: ", error);
            alert("Error en el ajax: " + error)
        });
    });
});