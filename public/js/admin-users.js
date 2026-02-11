document.addEventListener('DOMContentLoaded', function() {
    const statusEl = document.getElementById('usersStatus');
    const tableEl = document.getElementById('usersTable');

    fetch('/api/users')
        .then(res => {
            if (res.status === 401) {
                window.location.href = '/login';
                return null;
            }
            if (res.status === 403) {
                throw new Error('Forbidden');
            }
            if (!res.ok) throw new Error('Failed');
            return res.json();
        })
        .then(users => {
            if (!users) return;
            statusEl.classList.add('d-none');
            tableEl.innerHTML = renderTable(users);
        })
        .catch(err => {
            statusEl.classList.remove('alert-info');
            statusEl.classList.add('alert-danger');
            statusEl.textContent = err.message === 'Forbidden'
                ? 'You do not have permission to view this page.'
                : 'Unable to load users.';
        });

    tableEl.addEventListener('click', function(event) {
        const target = event.target.closest('[data-action="delete-user"]');
        if (!target) return;
        const userId = target.dataset.userId;
        const confirmed = confirm('Delete this user? This cannot be undone.');
        if (!confirmed) return;

        fetch(`/api/users/${userId}`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return fetch('/api/users');
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(users => {
                tableEl.innerHTML = renderTable(users);
            })
            .catch(() => {
                statusEl.classList.remove('alert-info');
                statusEl.classList.add('alert-danger');
                statusEl.textContent = 'Unable to delete user.';
            });
    });

    function renderTable(users) {
        if (!users.length) {
            return '<p>No users found.</p>';
        }

        return `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${escapeHtml(user.name)}</td>
                            <td>${escapeHtml(user.email)}</td>
                            <td>${escapeHtml(user.role || 'user')}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete-user" data-user-id="${user.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }
});
