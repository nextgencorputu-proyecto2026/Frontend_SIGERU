
//  NAVBAR

async function cargarNavbar() {
    const contenedor = document.getElementById("navbar-container");

    if (!contenedor) return;

    const rutaNavbar = "./components/navbar.html";

    try {

        const respuesta = await fetch(rutaNavbar);

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP ${respuesta.status}: ${respuesta.statusText}`
            );
        }

        contenedor.innerHTML = await respuesta.text();

    } catch (error) {

        contenedor.innerHTML = `
            <div class="alert alert-danger">
                No se pudo cargar la barra de navegación.
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", cargarNavbar);



/* ---------------------
    CAMIONES
--------------------- */

//   JS para API


const BusquedaCamiones = document.getElementById("formBusquedaCamiones");

if (BusquedaCamiones) {

    BusquedaCamiones.addEventListener("submit", async (e) => {

        e.preventDefault();

        const matricula = document.getElementById("inputMatricula").value.trim();

        let url = "http://127.0.0.1:8000/api/camiones";

        if (matricula !== "") {
            url += "?matricula=" + matricula;
        }

        try {

            const respuesta = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

            const camiones = await respuesta.json();

            cargarTabla(camiones);

        } catch (error) {

            console.error("Error al cargar camiones:", error);

        }

    });

}


// Funcion para cargar la tabla con los datos de los camiones

function cargarTabla(camiones) {

    const tabla = document.getElementById("tablaCamiones");

    if (!tabla) return;

    tabla.innerHTML = "";


    camiones.forEach(camion => {


        tabla.innerHTML += `

            <tr>

                <th scope="row">${camion.idVehiculo}</th>

                <td>${camion.tipo}</td>

                <td>${camion.capacidad}</td>

                <td>-</td>

                <td>-</td>

                <td>

                    <div class="list-group-horizontal">

                        <button class="verDatos btn btn-outline-primary btn-sm"
                            data-bs-toggle="modal" 
                            data-bs-target="#datosCamiones">
                            Ver
                        </button>


                        <button class="btn btn-outline-secondary btn-sm">
                            Editar
                        </button>


                        <button class="btn btn-outline-danger btn-sm">
                            Eliminar
                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}
if (document.getElementById("tablaCamiones")) {

    fetch("http://127.0.0.1:8000/api/camiones")
        .then(res => res.json())
        .then(data => cargarTabla(data.data))
        .catch(error => console.error(error));

}



/* --------------------
    CONTENEDORES
------------------------*/


let mapa = null;
let capaContenedores = null;



async function cargarMapaContenedores() {


    const elementoMapa = document.getElementById("mapa");


    // Si la página no tiene mapa, no ejecuta nada

    if (!elementoMapa) return;



    if (mapa === null) {


        mapa = L.map("mapa").setView(

            [-34.8965, -56.131],

            14

        );


        L.tileLayer(

            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

            {

                attribution: "&copy; OpenStreetMap",

                maxZoom: 19

            }

        ).addTo(mapa);



        capaContenedores = L.layerGroup().addTo(mapa);



    } else {


        mapa.invalidateSize();


    }



    try {


        const respuesta = await fetch(
            "http://127.0.0.1:8000/api/contenedores",
            {

                method: "GET",

                headers: {

                    "Accept": "application/json"

                }

            }

        );



        const contenedores = await respuesta.json();



        dibujarContenedores(contenedores.data);



    } catch (error) {


        console.error("Error al cargar contenedores:", error);


    }


}




function dibujarContenedores(contenedores) {


    if (!capaContenedores) return;


    capaContenedores.clearLayers();



    contenedores.forEach(contenedor => {



        const marcador = L.marker([
            contenedor.UbicacionY,
            contenedor.UbicacionX
        ]);



        marcador.on("click", () => {


            mostrarInformacion(contenedor);


        });



        marcador.addTo(capaContenedores);



    });


}





function mostrarInformacion(contenedor) {


    const id = document.getElementById("id");


    if (!id) return;



    document.getElementById("id").value = contenedor.idContenedor;
    document.getElementById("Nv_Llenado").value = contenedor.nivelLlenado;
    document.getElementById("ubiX").value = contenedor.UbicacionX;
    document.getElementById("ubiY").value = contenedor.UbicacionY;
    document.getElementById("Ruta").value = contenedor.idRuta;
    document.getElementById("Tipo_Residuo").value = contenedor.tipoResiduo;


}



// Ejecutar mapa solamente si existe

if (document.getElementById("mapa")) {

    cargarMapaContenedores();

}



/* ---------------------
    USUARIOS
--------------------- */

// Busqueda/listado de usuarios

const BusquedaUsuarios = document.getElementById("formBusquedaUsuarios");

if (BusquedaUsuarios) {

    BusquedaUsuarios.addEventListener("submit", async (e) => {

        e.preventDefault();

        const nombre = document.getElementById("inputNombre").value.trim();

        let url = "http://127.0.0.1:8000/api/usuarios";

        if (nombre !== "") {
            url += "?nombre=" + encodeURIComponent(nombre);
        }

        try {

            const respuesta = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

            const resultado = await respuesta.json();

            cargarTablaUsuarios(resultado.data);

        } catch (error) {

            console.error("Error al cargar usuarios:", error);

        }

    });

}


function cargarTablaUsuarios(usuarios) {

    const tabla = document.getElementById("tablaUsuarios");

    if (!tabla) return;

    tabla.innerHTML = "";

    usuarios.forEach(usuario => {

        tabla.innerHTML += `

            <tr>

                <th scope="row">${usuario.idUsu}</th>

                <td>${usuario.nombre1}</td>

                <td>${usuario.apellido1}</td>

                <td>-</td>

                <td>-</td>

                <td>-</td>

                <td>

                    <div class="list-group-horizontal">

                        <button class="verDatos btn btn-outline-primary btn-sm">Ver</button>

                        <button class="btn btn-outline-secondary btn-sm">Editar</button>

                        <button class="btn btn-outline-danger btn-sm">Eliminar</button>

                    </div>

                </td>

            </tr>

        `;

    });

}

// Cargar usuarios al entrar a la página si existe la tabla
if (document.getElementById("tablaUsuarios")) {

    fetch("http://127.0.0.1:8000/api/usuarios")
        .then(res => res.json())
        .then(data => cargarTablaUsuarios(data.data))
        .catch(error => console.error(error));

}


// Envío del formulario de registro de usuario mediante fetch

if (document.getElementById("formRegistroUsuario")) {

    const formRegistro = document.getElementById("formRegistroUsuario");

    formRegistro.addEventListener("submit", function (e) {

        e.preventDefault();

        const ci = document.getElementById("ci").value;
        const nombre1 = document.getElementById("nombre1").value;
        const nombre2 = document.getElementById("nombre2").value;
        const apellido1 = document.getElementById("apellido1").value;
        const apellido2 = document.getElementById("apellido2").value;
        const fec_nac = document.getElementById("fec_nac").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const parametros = "ci=" + encodeURIComponent(ci) +
            "&nombre1=" + encodeURIComponent(nombre1) +
            "&nombre2=" + encodeURIComponent(nombre2) +
            "&apellido1=" + encodeURIComponent(apellido1) +
            "&apellido2=" + encodeURIComponent(apellido2) +
            "&fec_nac=" + encodeURIComponent(fec_nac) +
            "&email=" + encodeURIComponent(email) +
            "&password=" + encodeURIComponent(password);

        fetch(formRegistro.action, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: parametros
        })
            .then(function (respuesta) {
                return respuesta.json();
            })
            .then(function (resultado) {

                if (resultado.data) {
                    alert("Usuario registrado correctamente");
                    document.getElementById("ci").value = "";
                    document.getElementById("nombre1").value = "";
                    document.getElementById("nombre2").value = "";
                    document.getElementById("apellido1").value = "";
                    document.getElementById("apellido2").value = "";
                    document.getElementById("fec_nac").value = "";
                    document.getElementById("email").value = "";
                    document.getElementById("password").value = "";
                } else {
                    alert("No se pudo registrar el usuario. Revise los datos.");
                }

            })
            .catch(function (error) {
                console.error("Error al enviar registro:", error);
            });

    });
}

/* ---------------------
LOGIN
--------------------- */

if (document.getElementById("formLogin")) {

    const formLogin = document.getElementById("formLogin");

    formLogin.addEventListener("submit", function (e) {

        e.preventDefault();

        const email = document.getElementById("Email").value;
        const password = document.getElementById("Password").value;

        const parametros = "email=" + encodeURIComponent(email) +
            "&password=" + encodeURIComponent(password);

        fetch(formLogin.action, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: parametros
        })
            .then(function (respuesta) {
                return respuesta.json();
            })
            .then(function (resultado) {

                if (resultado.success) {
                    window.location.href = "home.html";
                } else {
                    alert(resultado.mensaje);
                }

            })
            .catch(function (error) {
                console.error("Error al iniciar sesion:", error);
            });

    });
    /* ---------------------
        ALTA CONTENEDOR
    --------------------- */

    if (document.getElementById("formContenedor")) {

        const formContenedor = document.getElementById("formContenedor");

        formContenedor.addEventListener("submit", function (e) {

            e.preventDefault();

            const ubicacionX = document.getElementById("ubicacionX").value;
            const ubicacionY = document.getElementById("ubicacionY").value;
            const estado = document.getElementById("estado").value;
            const nivelLlenado = document.getElementById("nivelLlenado").value;
            const tipoResiduo = document.getElementById("tipoResiduo").value;
            const idRuta = document.getElementById("idRuta").value;

            const parametros = "UbicacionX=" + encodeURIComponent(ubicacionX) +
                "&UbicacionY=" + encodeURIComponent(ubicacionY) +
                "&Estado=" + encodeURIComponent(estado) +
                "&nivelLlenado=" + encodeURIComponent(nivelLlenado) +
                "&tipoResiduo=" + encodeURIComponent(tipoResiduo) +
                "&idRuta=" + encodeURIComponent(idRuta);

            fetch(formContenedor.action, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                },
                body: parametros
            })
                .then(function (respuesta) {
                    return respuesta.json();
                })
                .then(function (resultado) {


                    if (resultado.data) {
                        alert("Contenedor agregado correctamente");
                        document.getElementById("ubicacionX").value = "";
                        document.getElementById("ubicacionY").value = "";
                        document.getElementById("estado").value = "";
                        document.getElementById("nivelLlenado").value = "";
                        document.getElementById("tipoResiduo").value = "";
                        document.getElementById("idRuta").value = "";
                    } else {
                        alert("No se pudo agregar el contenedor. Revise los datos.");
                    }

                })
                .catch(function (error) {
                    console.error("Error al agregar contenedor:", error);
                });

        });



    }
}