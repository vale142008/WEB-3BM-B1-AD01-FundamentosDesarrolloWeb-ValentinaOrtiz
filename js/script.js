const USUARIOS = [
    { username: 'kamila', password: '12345', nombre: 'Kamila Suasnavas', rol: 'Cliente', estado: 'Activo' },
    { username: 'carlos', password: '12345', nombre: 'Carlos Mendoza', rol: 'Cliente', estado: 'Activo' },
    { username: 'ana', password: '12345', nombre: 'Ana Gómez', rol: 'Cliente', estado: 'Activo' },
    { username: 'admin', password: 'admin123', nombre: 'Administrador Principal', rol: 'Administrador', estado: 'Activo' }
];

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let solicitudes = JSON.parse(localStorage.getItem('solicitudes_mantenimiento')) || [];

if (solicitudes.length === 0) {
    solicitudes = [
        {
            id: 'SOL-1001',
            usuarioOwner: 'kamila',
            clienteNombre: 'Kamila Suasnavas',
            clienteEmail: 'kamila@mail.com',
            clienteTelefono: '0991112233',
            vehiculoPlaca: 'PBA-1234',
            vehiculoMarca: 'Toyota',
            vehiculoModelo: 'Corolla',
            vehiculoAnio: 2020,
            vehiculoKm: 45000,
            servicioTipo: 'Cambio de Aceite',
            fechaCita: '2026-11-15',
            horaCita: '09:00',
            modalidad: 'En Taller',
            adicionales: [],
            observaciones: 'Ninguna',
            estado: 'Pendiente'
        }
    ];
    localStorage.setItem('solicitudes_mantenimiento', JSON.stringify(solicitudes));
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarInterfazUsuario();

    const fechaInput = document.getElementById('fechaCita');
    if (fechaInput) {
        fechaInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }

    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', handleLogin);
    }

    const formSolicitud = document.getElementById('formSolicitud');
    if (formSolicitud) {
        formSolicitud.addEventListener('submit', handleRegistrarSolicitud);
    }

    if (document.getElementById('tablaClienteBody')) renderTablaCliente();
    if (document.getElementById('tablaAdminBody')) renderTablaAdmin();
});

function handleLogin(e) {
    e.preventDefault();
    const userIn = document.getElementById('loginUser').value.trim();
    const passIn = document.getElementById('loginPass').value.trim();

    const foundUser = USUARIOS.find(u => u.username === userIn && u.password === passIn);

    if (!foundUser) {
        Swal.fire('Error', 'Usuario o contraseña incorrectos.', 'error');
        return;
    }

    currentUser = foundUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    try {
        const modalEl = document.getElementById('loginModal');
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
        }
    } catch (err) {
        console.log(err);
    }

    Swal.fire({
        title: `¡Bienvenido, ${currentUser.nombre}!`,
        icon: 'success',
        timer: 1300,
        showConfirmButton: false
    }).then(() => {
        if (currentUser.rol === 'Administrador') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'cuenta.html';
        }
    });
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function actualizarInterfazUsuario() {
    const userOnlyElems = document.querySelectorAll('.user-only');
    const adminOnlyElems = document.querySelectorAll('.admin-only');
    const btnLogin = document.getElementById('btnLoginModal');
    const btnLogout = document.getElementById('btnLogout');
    const userInfo = document.getElementById('userInfo');

    if (!currentUser) {
        if (btnLogin) btnLogin.classList.remove('d-none');
        if (btnLogout) btnLogout.classList.add('d-none');
        if (userInfo) userInfo.classList.add('d-none');
        userOnlyElems.forEach(el => el.classList.add('d-none'));
        adminOnlyElems.forEach(el => el.classList.add('d-none'));
    } else {
        if (btnLogin) btnLogin.classList.add('d-none');
        if (btnLogout) btnLogout.classList.remove('d-none');
        if (userInfo) userInfo.classList.remove('d-none');
        
        const nameDisplay = document.getElementById('userNameDisplay');
        const roleBadge = document.getElementById('userRoleBadge');
        if (nameDisplay) nameDisplay.textContent = currentUser.nombre;
        if (roleBadge) roleBadge.textContent = currentUser.rol;

        if (currentUser.rol === 'Cliente') {
            userOnlyElems.forEach(el => el.classList.remove('d-none'));
            adminOnlyElems.forEach(el => el.classList.add('d-none'));
            const cNombre = document.getElementById('clienteNombre');
            const cEmail = document.getElementById('clienteEmail');
            if (cNombre) cNombre.value = currentUser.nombre;
            if (cEmail) cEmail.value = `${currentUser.username}@mail.com`;
        } else if (currentUser.rol === 'Administrador') {
            userOnlyElems.forEach(el => el.classList.remove('d-none'));
            adminOnlyElems.forEach(el => el.classList.remove('d-none'));
        }
    }
}

function handleRegistrarSolicitud(e) {
    e.preventDefault();

    const nombre = document.getElementById('clienteNombre').value.trim();
    const email = document.getElementById('clienteEmail').value.trim();
    const telefono = document.getElementById('clienteTelefono').value.trim();
    const placa = document.getElementById('vehiculoPlaca').value.trim().toUpperCase();
    const marca = document.getElementById('vehiculoMarca').value.trim();
    const modelo = document.getElementById('vehiculoModelo').value.trim();
    const anio = parseInt(document.getElementById('vehiculoAnio').value);
    const km = parseInt(document.getElementById('vehiculoKm').value);
    const servicio = document.getElementById('servicioTipo').value;
    const fecha = document.getElementById('fechaCita').value;
    const hora = document.getElementById('horaCita').value;
    const modalidad = document.querySelector('input[name="modalidad"]:checked').value;
    const observaciones = document.getElementById('observaciones').value.trim();

    if (!/^[0-9]{10}$/.test(telefono)) {
        Swal.fire('Error', 'Teléfono debe tener 10 dígitos.', 'warning');
        return;
    }

    if (!/^[A-Z]{3}-\d{3,4}$/.test(placa)) {
        Swal.fire('Error', 'Placa inválida (Ej: ABC-1234).', 'warning');
        return;
    }

    // Se asigna automáticamente al usuario que ha iniciado sesión actualmente
    let owner = currentUser ? currentUser.username : 'cliente1';

    const idUnico = 'SOL-' + Math.floor(1000 + Math.random() * 9000);

    const nuevaSolicitud = {
        id: idUnico,
        usuarioOwner: owner,
        clienteNombre: nombre,
        clienteEmail: email,
        clienteTelefono: telefono,
        vehiculoPlaca: placa,
        vehiculoMarca: marca,
        vehiculoModelo: modelo,
        vehiculoAnio: anio,
        vehiculoKm: km,
        servicioTipo: servicio,
        fechaCita: fecha,
        horaCita: hora,
        modalidad: modalidad,
        adicionales: [],
        observaciones: observaciones,
        estado: 'Pendiente'
    };

    solicitudes.push(nuevaSolicitud);
    localStorage.setItem('solicitudes_mantenimiento', JSON.stringify(solicitudes));

    Swal.fire('Éxito', `Solicitud ${idUnico} guardada correctamente.`, 'success').then(() => {
        window.location.href = 'cuenta.html';
    });
}

function renderTablaCliente() {
    const tbody = document.getElementById('tablaClienteBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!currentUser) return;
    
    let mis = [];
    if (currentUser.rol === 'Administrador') {
        mis = solicitudes;
    } else {
        mis = solicitudes.filter(s => s.usuarioOwner === currentUser.username);
    }

    if (mis.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No tienes solicitudes registradas.</td></tr>`;
        return;
    }

    mis.forEach(sol => {
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold">${sol.id}</td>
                <td>${sol.vehiculoMarca} ${sol.vehiculoModelo} (${sol.vehiculoAnio})</td>
                <td><span class="badge bg-secondary">${sol.vehiculoPlaca}</span></td>
                <td>${sol.servicioTipo}</td>
                <td>${sol.fechaCita} - ${sol.horaCita}</td>
                <td><span class="badge ${getBadgeClass(sol.estado)}">${sol.estado}</span></td>
            </tr>
        `;
    });
}

function renderTablaAdmin(lista = solicitudes) {
    const tbody = document.getElementById('tablaAdminBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Sin registros disponibles.</td></tr>`;
        return;
    }

    const esAdmin = currentUser && currentUser.rol === 'Administrador';

    lista.forEach(sol => {
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold">${sol.id}</td>
                <td>${sol.clienteNombre}<br><small class="text-muted">${sol.clienteTelefono}</small></td>
                <td>${sol.vehiculoMarca} ${sol.vehiculoModelo}<br><span class="badge bg-secondary">${sol.vehiculoPlaca}</span></td>
                <td>${sol.servicioTipo}</td>
                <td>${sol.fechaCita}</td>
                <td>
                    ${esAdmin ? `
                        <select class="form-select form-select-sm" onchange="cambiarEstadoDirecto('${sol.id}', this.value)">
                            <option value="Pendiente" ${sol.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Proceso" ${sol.estado === 'Proceso' ? 'selected' : ''}>Proceso</option>
                            <option value="Listo" ${sol.estado === 'Listo' ? 'selected' : ''}>Listo</option>
                        </select>
                    ` : `
                        <span class="badge ${getBadgeClass(sol.estado)}">${sol.estado}</span>
                    `}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmarEliminar('${sol.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function cambiarEstadoDirecto(id, nuevoEstado) {
    const sol = solicitudes.find(s => s.id === id);
    if (sol) {
        sol.estado = nuevoEstado;
        localStorage.setItem('solicitudes_mantenimiento', JSON.stringify(solicitudes));
        if (document.getElementById('tablaClienteBody')) renderTablaCliente();
        Swal.fire({
            title: 'Estado actualizado',
            text: `La solicitud ${id} cambió a ${nuevoEstado}`,
            icon: 'success',
            timer: 1200,
            showConfirmButton: false
        });
    }
}

function confirmarEliminar(id) {
    Swal.fire({
        title: '¿Eliminar solicitud?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(res => {
        if (res.isConfirmed) {
            solicitudes = solicitudes.filter(s => s.id !== id);
            localStorage.setItem('solicitudes_mantenimiento', JSON.stringify(solicitudes));
            renderTablaAdmin();
        }
    });
}

function filtrarTablaAdmin() {
    const texto = document.getElementById('filtroBuscar').value.toLowerCase();
    const filtrados = solicitudes.filter(s => s.clienteNombre.toLowerCase().includes(texto) || s.vehiculoPlaca.toLowerCase().includes(texto));
    renderTablaAdmin(filtrados);
}

function getBadgeClass(estado) {
    switch (estado) {
        case 'Pendiente': return 'badge-pendiente';
        case 'Proceso': return 'badge-en-proceso';
        case 'Listo': return 'badge-finalizado';
        default: return 'badge-pendiente';
    }
}