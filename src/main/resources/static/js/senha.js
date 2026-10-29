// senha.js - Versão corrigida
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Script de senha carregado'); // Para testar

    document.querySelectorAll('.toggle-password').forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👁️ Clicou no olhinho'); // Para testar

            // Encontra o input dentro do mesmo container
            const container = this.closest('.password-container');
            if (!container) return;

            const passwordInput = container.querySelector('input');
            if (!passwordInput) return;

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.textContent = '👁️‍🗨️';
            } else {
                passwordInput.type = 'password';
                this.textContent = '👁️';
            }
        });
    });
});