
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

        let url = "../APIs_SIGERU/getCamiones.php";

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

                <th scope="row">${camion.id}</th>

                <td>${camion.matricula}</td>

                <td>${camion.tipo}</td>

                <td>${camion.ruta}</td>

                <td>${camion.estado}</td>

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

    fetch("../APIs_SIGERU/getCamiones.php")
        .then(res => res.json())
        .then(data => cargarTabla(data))
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
            "../APIs_SIGERU/getContenedores.php",
            {

                method: "GET",

                headers: {

                    "Accept": "application/json"

                }

            }

        );



        const contenedores = await respuesta.json();



        dibujarContenedores(contenedores);



    } catch (error) {


        console.error("Error al cargar contenedores:", error);


    }


}




function dibujarContenedores(contenedores) {


    if (!capaContenedores) return;


    capaContenedores.clearLayers();



    contenedores.forEach(contenedor => {



        const marcador = L.marker([

            contenedor.Ubi_Y,

            contenedor.Ubi_X

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



    document.getElementById("id").value = contenedor.ID;

    document.getElementById("Nv_Llenado").value = contenedor.Nv_Llenado;

    document.getElementById("ubiX").value = contenedor.Ubi_X;

    document.getElementById("ubiY").value = contenedor.Ubi_Y;

    document.getElementById("Ruta").value = contenedor.Ruta;

    document.getElementById("Tipo_Residuo").value = contenedor.Tipo_Residuo;


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

        let url = "../APIs_SIGERU/usuarios/routes/listarUsuarios.php";

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

            const usuarios = await respuesta.json();

            cargarTablaUsuarios(usuarios);

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

                <th scope="row">${usuario.id}</th>

                <td>${usuario.nombre}</td>

                <td>${usuario.email}</td>

                <td>${usuario.rol}</td>

                <td>${usuario.estado}</td>

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

    fetch("../APIs_SIGERU/usuarios/routes/listarUsuarios.php")
        .then(res => res.json())
        .then(data => cargarTablaUsuarios(data))
        .catch(error => console.error(error));

}


// Envío del formulario de registro de usuario mediante fetch

if (document.getElementById("formRegistroUsuario")) {

    const formRegistro = document.getElementById("formRegistroUsuario");

    formRegistro.addEventListener("submit", function (e) {

        e.preventDefault();

        const nombre = document.getElementById("nombre").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const rol = document.getElementById("rol").value;

        const parametros = "nombre=" + encodeURIComponent(nombre) +
            "&email=" + encodeURIComponent(email) +
            "&password=" + encodeURIComponent(password) +
            "&rol=" + encodeURIComponent(rol);

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

                if (resultado.success) {
                    alert(resultado.mensaje);
                    document.getElementById("nombre").value = "";
                    document.getElementById("email").value = "";
                    document.getElementById("password").value = "";
                    document.getElementById("rol").value = "";
                } else {
                    alert("No se pudo registrar el usuario. Revise los datos.");
                }

            })
            .catch(function (error) {
                console.error("Error al enviar registro:", error);
            });

    });

}