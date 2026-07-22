
/* ---------------------
    CAMIONES
--------------------- */

// Funcion para cargar la tabla con los datos de los camiones
function cargarTabla(camiones) {

    const tabla = document.getElementById("tablaCamiones");

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
                            data-bs-toggle="modal" data-bs-target="#datosCamiones">
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





