
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