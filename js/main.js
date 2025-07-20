document.addEventListener('DOMContentLoaded', function() {
    const checkKeyBtn = document.getElementById('checkKeyBtn');
    const keyInput = document.getElementById('keyInput');
    const modal = document.getElementById('keyModal');
    const closeModal = document.querySelector('.close');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalResult = document.getElementById('modalResult');
    const terminalOutput = document.getElementById('terminalOutput');

    // Terminal-like behavior for key input
    keyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const key = this.value.trim();
            if (key) {
                verifyKey(key);
            }
        }
    });

    // Check key button
    checkKeyBtn.addEventListener('click', function() {
        const key = keyInput.value.trim();
        if (key) {
            verifyKey(key);
        } else {
            showModal('Please enter a key first', 'error');
        }
    });

    // Modal close handlers
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    closeModalBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Key verification function
    function verifyKey(key) {
        addTerminalOutput(`> Verifying key: ${key}...`);
        
        fetch(`/verify?key=${key}`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Invalid key');
                }
            })
            .then(data => {
                if (data.valid) {
                    addTerminalOutput('> Key verified successfully!');
                    showModal('Key is valid! You can now use Faint.', 'success');
                } else {
                    addTerminalOutput('> Key verification failed');
                    showModal('Invalid key. Please purchase a valid key.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                addTerminalOutput('> Error during verification');
                showModal('Error during verification. Please try again.', 'error');
            });
    }

    // Helper functions
    function showModal(message, type) {
        modalResult.textContent = message;
        modalResult.style.backgroundColor = type === 'success' ? 'rgba(0, 200, 83, 0.2)' : 'rgba(213, 0, 0, 0.2)';
        modalResult.style.color = type === 'success' ? 'var(--success)' : 'var(--error)';
        modal.style.display = 'block';
    }

    function addTerminalOutput(message) {
        const newLine = document.createElement('div');
        newLine.textContent = message;
        terminalOutput.appendChild(newLine);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    // Simulate terminal typing effect on page load
    function simulateTyping() {
        const messages = [
            "> Initializing Faint...",
            "> Checking system integrity...",
            "> Ready for key verification"
        ];
        
        terminalOutput.innerHTML = '';
        
        messages.forEach((message, index) => {
            setTimeout(() => {
                addTerminalOutput(message);
            }, index * 800);
        });
    }

    simulateTyping();
});