// AI Personal Finance Manager with Voice Commands - JavaScript

class FinanceManager {
    constructor() {
        this.transactions = this.loadData('transactions') || this.getSampleTransactions();
        this.budgets = this.loadData('budgets') || this.getSampleBudgets();
        this.currentBalance = this.loadData('currentBalance') || 32000;
        this.theme = this.loadData('theme') || 'light';
        this.editingTransactionId = null;
        
        // Voice Recognition Setup
        this.recognition = null;
        this.isListening = false;
        this.voiceEnabled = true;
        this.speechSynthesis = window.speechSynthesis;
        this.voiceResponseEnabled = this.loadData('voiceResponseEnabled') !== false;
        
        this.categories = {
            income: ["Salary", "Freelance", "Investment", "Business", "Other"],
            expense: ["Food", "Transport", "Entertainment", "Shopping", "Bills", "Healthcare", "Education", "Other"]
        };

        this.aiKeywords = {
            "spending": "Your current monthly spending is ₹35,000. You're within your budget!",
            "budget": "You have active budgets for 3 categories. Food: 75% used, Transport: 80% used.",
            "save": "Based on your income, I recommend saving at least 20% monthly. That's ₹10,000.",
            "money": "Your current balance is ₹32,000. You've saved ₹7,000 this month!",
            "income": "Your total income this month is ₹55,000 from salary and freelance work.",
            "expense": "Your major expenses are Food (43%), Transport (23%), and Entertainment (34%).",
            "investment": "Consider investing 15-20% of your income in mutual funds or SIPs.",
            "debt": "Keep your debt-to-income ratio below 30% for healthy finances.",
            "loan": "If taking a loan, ensure EMI doesn't exceed 40% of your monthly income.",
            "credit": "Maintain a credit utilization ratio below 30% for a good credit score.",
            "financial": "Your financial health looks good with consistent savings and controlled expenses.",
            "planning": "Set SMART financial goals: Specific, Measurable, Achievable, Relevant, Time-bound.",
            "goal": "Define short-term (1 year), medium-term (3-5 years), and long-term (10+ years) goals.",
            "emergency": "Aim for 6-12 months of expenses in your emergency fund (₹2,10,000-₹4,20,000).",
            "fund": "Emergency funds should be in liquid savings or short-term deposits.",
            "retirement": "Start retirement planning early. Contribute to PPF, ELSS, and NPS.",
            "tax": "Use Section 80C deductions: PPF, ELSS, life insurance premiums up to ₹1.5L.",
            "insurance": "Ensure adequate health (10x annual income) and life insurance coverage.",
            "track": "Regular expense tracking helps identify spending patterns and save money.",
            "analyze": "Your spending analysis shows consistent patterns with room for optimization.",
            "report": "Generate monthly reports to review your financial progress and goals."
        };

        this.aiInsights = [
            "Your food expenses are 25% lower than last month - great job!",
            "Consider setting up an emergency fund with 6 months of expenses.",
            "Your entertainment spending is approaching the monthly limit.",
            "You saved ₹7,000 this month compared to your average spending."
        ];

        // Initialize when DOM is ready
        this.initWhenReady();
    }

    initWhenReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // DOM is already ready
            setTimeout(() => this.init(), 0);
        }
    }

    init() {
        try {
            console.log('Initializing FinanceManager...');
            this.initializeVoiceRecognition();
            this.setTheme(this.theme);
            this.setupEventListeners();
            this.populateSelects();
            this.updateDashboard();
            this.showTab('dashboard');
            this.displayAIInsights();
            this.updateBudgetDisplay();
            this.updateTransactionsTable();
            this.initializeCharts();
            this.updateVoiceStatus('Ready');
            console.log('FinanceManager with Voice Commands initialized successfully');
        } catch (error) {
            console.error('Error initializing FinanceManager:', error);
        }
    }

    // Voice Recognition Initialization
    initializeVoiceRecognition() {
        try {
            // Check for browser support
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                console.warn('Speech Recognition not supported in this browser');
                this.voiceEnabled = false;
                this.updateVoiceStatus('Not Supported');
                return;
            }

            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-IN'; // Indian English

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceStatus('Listening');
                this.showVoiceTranscript();
            };

            this.recognition.onresult = (event) => {
                this.handleVoiceResult(event);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateVoiceStatus('Error');
                this.hideVoiceTranscript();
                this.isListening = false;
                this.updateVoiceButtonState(false);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceStatus('Ready');
                this.hideVoiceTranscript();
                this.updateVoiceButtonState(false);
            };

            console.log('Voice Recognition initialized successfully');
        } catch (error) {
            console.error('Error initializing voice recognition:', error);
            this.voiceEnabled = false;
            this.updateVoiceStatus('Error');
        }
    }

    // Voice Command Processing
    handleVoiceResult(event) {
        try {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update transcript display
            this.updateTranscriptDisplay(interimTranscript || finalTranscript);

            if (finalTranscript) {
                console.log('Voice command received:', finalTranscript);
                this.processVoiceCommand(finalTranscript.toLowerCase().trim());
                this.stopListening();
            }
        } catch (error) {
            console.error('Error handling voice result:', error);
        }
    }

    // Process and execute voice commands
    processVoiceCommand(command) {
        try {
            this.updateVoiceStatus('Processing');
            
            // Navigation commands
            if (command.includes('go to dashboard') || command.includes('show dashboard')) {
                this.showTab('dashboard');
                this.speak('Showing dashboard');
                return;
            }
            
            if (command.includes('show transactions') || command.includes('go to transactions')) {
                this.showTab('transactions');
                this.speak('Showing transactions');
                return;
            }
            
            if (command.includes('show budget') || command.includes('open budget') || command.includes('go to budget')) {
                this.showTab('budget');
                this.speak('Showing budget');
                return;
            }
            
            if (command.includes('show analytics') || command.includes('open analytics') || command.includes('go to analytics')) {
                this.showTab('analytics');
                this.speak('Showing analytics');
                return;
            }

            // Balance query
            if (command.includes('balance') || command.includes('what\'s my balance')) {
                const balance = this.formatCurrency(this.currentBalance);
                this.speak(`Your current balance is ${balance}`);
                return;
            }

            // Expense query
            if (command.includes('what are my expenses') || command.includes('show expenses')) {
                const monthlyExpenses = this.calculateMonthlyExpenses();
                this.speak(`Your monthly expenses are ${this.formatCurrency(monthlyExpenses)}`);
                return;
            }

            // Add income command
            const incomeMatch = command.match(/add income (\d+(?:,\d+)*(?:\.\d+)?)\s*(?:from|for)?\s*(\w+)?\s*(?:for)?\s*(.*)?/i);
            if (incomeMatch) {
                this.processAddIncomeCommand(incomeMatch);
                return;
            }

            // Add expense command
            const expenseMatch = command.match(/add expense (\d+(?:,\d+)*(?:\.\d+)?)\s*(?:for)?\s*(\w+)?\s*(.*)?/i);
            if (expenseMatch) {
                this.processAddExpenseCommand(expenseMatch);
                return;
            }

            // Set budget command
            const budgetMatch = command.match(/set budget (\d+(?:,\d+)*(?:\.\d+)?)\s*(?:for)?\s*(\w+)/i);
            if (budgetMatch) {
                this.processSetBudgetCommand(budgetMatch);
                return;
            }

            // Category spending query
            const spendingMatch = command.match(/how much.*spent.*(\w+)|spending.*(\w+)/i);
            if (spendingMatch) {
                const category = spendingMatch[1] || spendingMatch[2];
                this.processSpendingQuery(category);
                return;
            }

            // Delete last transaction
            if (command.includes('delete last transaction') || command.includes('remove last transaction')) {
                this.processDeleteLastTransaction();
                return;
            }

            // Financial advice
            if (command.includes('financial advice') || command.includes('give me advice')) {
                this.speak('Based on your spending patterns, I recommend maintaining your current savings rate and consider diversifying your investments for better returns.');
                return;
            }

            // Help command
            if (command.includes('help') || command.includes('voice commands')) {
                this.showVoiceHelpPanel();
                this.speak('Voice command help is now displayed. You can use commands like add expense, show balance, or set budget.');
                return;
            }

            // Export data
            if (command.includes('export') || command.includes('download data')) {
                this.exportData();
                return;
            }

            // Show budgets
            if (command.includes('show budgets') || command.includes('show my budgets')) {
                this.showTab('budget');
                this.speak('Here are your current budgets');
                return;
            }

            // Monthly report
            if (command.includes('monthly report') || command.includes('show report')) {
                this.generateMonthlyReport();
                return;
            }

            // Fallback response
            this.speak('I didn\'t understand that command. Try saying "help" for available voice commands.');
            
        } catch (error) {
            console.error('Error processing voice command:', error);
            this.speak('Sorry, there was an error processing your command.');
        } finally {
            this.updateVoiceStatus('Ready');
        }
    }

    // Process add income voice command
    processAddIncomeCommand(match) {
        try {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            const category = this.findCategory(match[2], 'income') || 'Other';
            const description = match[3] || `Income from ${category}`;

            const transaction = {
                id: Date.now(),
                type: 'income',
                amount: amount,
                category: category,
                description: description.trim(),
                date: new Date().toISOString().split('T')[0]
            };

            this.transactions.push(transaction);
            this.saveData('transactions', this.transactions);
            this.updateDashboard();
            this.updateTransactionsTable();
            
            this.speak(`Added income of ${this.formatCurrency(amount)} from ${category}`);
            this.showToast(`Income of ${this.formatCurrency(amount)} added successfully!`);
        } catch (error) {
            console.error('Error processing add income command:', error);
            this.speak('Sorry, I couldn\'t add that income. Please try again.');
        }
    }

    // Process add expense voice command
    processAddExpenseCommand(match) {
        try {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            const category = this.findCategory(match[2], 'expense') || 'Other';
            const description = match[3] || `Expense for ${category}`;

            const transaction = {
                id: Date.now(),
                type: 'expense',
                amount: amount,
                category: category,
                description: description.trim(),
                date: new Date().toISOString().split('T')[0]
            };

            this.transactions.push(transaction);
            this.saveData('transactions', this.transactions);
            this.updateDashboard();
            this.updateTransactionsTable();
            this.updateBudgetDisplay();
            
            this.speak(`Added expense of ${this.formatCurrency(amount)} for ${category}`);
            this.showToast(`Expense of ${this.formatCurrency(amount)} added successfully!`);
        } catch (error) {
            console.error('Error processing add expense command:', error);
            this.speak('Sorry, I couldn\'t add that expense. Please try again.');
        }
    }

    // Process set budget voice command
    processSetBudgetCommand(match) {
        try {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            const category = this.findCategory(match[2], 'expense') || match[2];

            if (!category) {
                this.speak('Please specify a category for the budget.');
                return;
            }

            const existingBudget = this.budgets.find(b => b.category.toLowerCase() === category.toLowerCase());
            if (existingBudget) {
                existingBudget.limit = amount;
            } else {
                this.budgets.push({
                    category: category,
                    limit: amount,
                    spent: this.calculateCategorySpending(category)
                });
            }

            this.saveData('budgets', this.budgets);
            this.updateBudgetDisplay();
            
            this.speak(`Set budget of ${this.formatCurrency(amount)} for ${category}`);
            this.showToast(`Budget set for ${category}: ${this.formatCurrency(amount)}`);
        } catch (error) {
            console.error('Error processing set budget command:', error);
            this.speak('Sorry, I couldn\'t set that budget. Please try again.');
        }
    }

    // Process spending query
    processSpendingQuery(category) {
        try {
            const normalizedCategory = this.findCategory(category, 'expense');
            if (!normalizedCategory) {
                this.speak(`I couldn't find spending data for ${category}`);
                return;
            }

            const spent = this.calculateCategorySpending(normalizedCategory);
            this.speak(`You have spent ${this.formatCurrency(spent)} on ${normalizedCategory} this month`);
        } catch (error) {
            console.error('Error processing spending query:', error);
            this.speak('Sorry, I couldn\'t get that spending information.');
        }
    }

    // Process delete last transaction
    processDeleteLastTransaction() {
        try {
            if (this.transactions.length === 0) {
                this.speak('No transactions to delete');
                return;
            }

            const lastTransaction = this.transactions[this.transactions.length - 1];
            this.transactions.pop();
            this.saveData('transactions', this.transactions);
            this.updateDashboard();
            this.updateTransactionsTable();
            this.updateBudgetDisplay();
            
            this.speak(`Deleted last transaction: ${lastTransaction.type} of ${this.formatCurrency(lastTransaction.amount)}`);
            this.showToast('Last transaction deleted successfully!');
        } catch (error) {
            console.error('Error deleting last transaction:', error);
            this.speak('Sorry, I couldn\'t delete the last transaction.');
        }
    }

    // Generate monthly report via voice
    generateMonthlyReport() {
        try {
            const monthlyIncome = this.calculateMonthlyIncome();
            const monthlyExpenses = this.calculateMonthlyExpenses();
            const netSavings = monthlyIncome - monthlyExpenses;
            
            const report = `Your monthly report: Income ${this.formatCurrency(monthlyIncome)}, Expenses ${this.formatCurrency(monthlyExpenses)}, Net savings ${this.formatCurrency(netSavings)}`;
            this.speak(report);
            
            this.showToast('Monthly report generated!');
        } catch (error) {
            console.error('Error generating monthly report:', error);
            this.speak('Sorry, I couldn\'t generate the monthly report.');
        }
    }

    // Helper method to find matching category
    findCategory(input, type) {
        if (!input) return null;
        
        const normalizedInput = input.toLowerCase();
        const categories = this.categories[type];
        
        // Exact match
        const exactMatch = categories.find(cat => cat.toLowerCase() === normalizedInput);
        if (exactMatch) return exactMatch;
        
        // Partial match
        const partialMatch = categories.find(cat => 
            cat.toLowerCase().includes(normalizedInput) || 
            normalizedInput.includes(cat.toLowerCase())
        );
        if (partialMatch) return partialMatch;
        
        // Common aliases
        const aliases = {
            'food': 'Food',
            'car': 'Transport',
            'movie': 'Entertainment',
            'shop': 'Shopping',
            'medical': 'Healthcare',
            'study': 'Education',
            'work': 'Salary',
            'job': 'Salary',
            'business': 'Business',
            'invest': 'Investment'
        };
        
        return aliases[normalizedInput] || null;
    }

    // Calculate monthly income
    calculateMonthlyIncome() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'income' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // Calculate monthly expenses
    calculateMonthlyExpenses() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // Voice Interface Methods
    toggleVoiceListening() {
        if (!this.voiceEnabled || !this.recognition) {
            this.speak('Voice recognition is not available in this browser.');
            this.showToast('Voice recognition not supported', 'error');
            return;
        }

        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        try {
            if (!this.voiceEnabled || !this.recognition) return;
            
            this.recognition.start();
            this.updateVoiceButtonState(true);
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            this.updateVoiceStatus('Error');
            this.showToast('Error starting voice recognition', 'error');
        }
    }

    stopListening() {
        try {
            if (this.recognition && this.isListening) {
                this.recognition.stop();
            }
            this.updateVoiceButtonState(false);
        } catch (error) {
            console.error('Error stopping voice recognition:', error);
        }
    }

    // Text-to-Speech
    speak(text) {
        if (!this.voiceResponseEnabled || !this.speechSynthesis) return;

        try {
            // Cancel any ongoing speech
            this.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;

            // Try to use a female voice
            const voices = this.speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.name.includes('Female') || 
                voice.name.includes('Samantha') || 
                voice.name.includes('Zira')
            );
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }

            this.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Error with speech synthesis:', error);
        }
    }

    // UI Update Methods
    updateVoiceStatus(status) {
        const statusElement = document.getElementById('voiceStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `voice-status ${status.toLowerCase()}`;
        }
    }

    updateVoiceButtonState(active) {
        const voiceBtn = document.getElementById('voiceButton');
        const voiceWave = voiceBtn?.querySelector('.voice-wave');
        
        if (voiceBtn) {
            if (active) {
                voiceBtn.classList.add('active');
                if (voiceWave) voiceWave.classList.remove('hidden');
            } else {
                voiceBtn.classList.remove('active');
                if (voiceWave) voiceWave.classList.add('hidden');
            }
        }
    }

    showVoiceTranscript() {
        const transcript = document.getElementById('voiceTranscript');
        if (transcript) {
            transcript.classList.remove('hidden');
        }
    }

    hideVoiceTranscript() {
        const transcript = document.getElementById('voiceTranscript');
        if (transcript) {
            transcript.classList.add('hidden');
        }
    }

    updateTranscriptDisplay(text) {
        const transcriptText = document.getElementById('transcriptText');
        if (transcriptText) {
            transcriptText.textContent = text || 'Say something...';
        }
    }

    showVoiceHelpPanel() {
        const panel = document.getElementById('voiceHelpPanel');
        if (panel) {
            panel.classList.remove('hidden');
        }
    }

    hideVoiceHelpPanel() {
        const panel = document.getElementById('voiceHelpPanel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }

    getSampleTransactions() {
        return [
            {id: 1, type: "income", amount: 50000, category: "Salary", description: "Monthly salary", date: "2025-09-01"},
            {id: 2, type: "expense", amount: 15000, category: "Food", description: "Groceries and dining", date: "2025-09-05"},
            {id: 3, type: "expense", amount: 8000, category: "Transport", description: "Fuel and maintenance", date: "2025-09-07"},
            {id: 4, type: "income", amount: 5000, category: "Freelance", description: "Web development project", date: "2025-09-10"},
            {id: 5, type: "expense", amount: 12000, category: "Entertainment", description: "Movies and gaming", date: "2025-09-12"}
        ];
    }

    getSampleBudgets() {
        return [
            {category: "Food", limit: 20000, spent: 15000},
            {category: "Transport", limit: 10000, spent: 8000},
            {category: "Entertainment", limit: 15000, spent: 12000}
        ];
    }

    setupEventListeners() {
        try {
            console.log('Setting up event listeners...');
            
            // Voice interface events
            const voiceButton = document.getElementById('voiceButton');
            const voiceHelpBtn = document.getElementById('voiceHelpBtn');
            const closeVoiceHelp = document.getElementById('closeVoiceHelp');
            const stopVoiceBtn = document.getElementById('stopVoiceBtn');

            if (voiceButton) {
                voiceButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Voice button clicked');
                    this.toggleVoiceListening();
                });
            }

            if (voiceHelpBtn) {
                voiceHelpBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Voice help button clicked');
                    this.showVoiceHelpPanel();
                });
            }

            if (closeVoiceHelp) {
                closeVoiceHelp.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.hideVoiceHelpPanel();
                });
            }

            if (stopVoiceBtn) {
                stopVoiceBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.stopListening();
                });
            }

            // Close voice help panel on outside click
            const voiceHelpPanel = document.getElementById('voiceHelpPanel');
            if (voiceHelpPanel) {
                voiceHelpPanel.addEventListener('click', (e) => {
                    if (e.target === voiceHelpPanel) {
                        this.hideVoiceHelpPanel();
                    }
                });
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + Shift + V for voice activation
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
                    e.preventDefault();
                    this.toggleVoiceListening();
                }
                // Escape to stop listening or close help panel
                if (e.key === 'Escape') {
                    if (this.isListening) {
                        this.stopListening();
                    }
                    this.hideVoiceHelpPanel();
                }
            });

            // Theme toggle
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleTheme();
                });
            }

            // Navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tab = e.target.dataset.tab;
                    console.log('Navigation clicked:', tab);
                    if (tab) {
                        this.showTab(tab);
                    }
                });
            });

            // Quick actions
            const addIncomeBtn = document.getElementById('addIncomeBtn');
            const addExpenseBtn = document.getElementById('addExpenseBtn');
            const setBudgetBtn = document.getElementById('setBudgetBtn');
            const exportDataBtn = document.getElementById('exportDataBtn');
            const addBudgetBtn = document.getElementById('addBudgetBtn');

            if (addIncomeBtn) {
                addIncomeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Add income clicked');
                    this.showTransactionModal('income');
                });
            }
            
            if (addExpenseBtn) {
                addExpenseBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Add expense clicked');
                    this.showTransactionModal('expense');
                });
            }
            
            if (setBudgetBtn) {
                setBudgetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Set budget clicked');
                    this.showBudgetModal();
                });
            }
            
            if (exportDataBtn) {
                exportDataBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Export data clicked');
                    this.exportData();
                });
            }

            if (addBudgetBtn) {
                addBudgetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Add budget clicked');
                    this.showBudgetModal();
                });
            }

            // Form submissions
            const transactionForm = document.getElementById('transactionForm');
            const budgetForm = document.getElementById('budgetForm');

            if (transactionForm) {
                transactionForm.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
            }
            
            if (budgetForm) {
                budgetForm.addEventListener('submit', (e) => this.handleBudgetSubmit(e));
            }

            // Modal controls
            this.setupModalControls();

            // Filters
            const typeFilter = document.getElementById('typeFilter');
            const categoryFilter = document.getElementById('categoryFilter');
            const searchFilter = document.getElementById('searchFilter');

            if (typeFilter) typeFilter.addEventListener('change', () => this.updateTransactionsTable());
            if (categoryFilter) categoryFilter.addEventListener('change', () => this.updateTransactionsTable());
            if (searchFilter) searchFilter.addEventListener('input', () => this.updateTransactionsTable());

            // Chat
            const sendChatBtn = document.getElementById('sendChatBtn');
            const chatInput = document.getElementById('chatInput');

            if (sendChatBtn) {
                sendChatBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleChatMessage();
                });
            }
            
            if (chatInput) {
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleChatMessage();
                    }
                });
            }

            // Transaction type change
            const transactionType = document.getElementById('transactionType');
            if (transactionType) {
                transactionType.addEventListener('change', (e) => {
                    this.populateCategories(e.target.value);
                });
            }

            console.log('Event listeners set up successfully');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    setupModalControls() {
        try {
            // Transaction modal
            const closeTransactionModal = document.getElementById('closeTransactionModal');
            const cancelTransactionBtn = document.getElementById('cancelTransactionBtn');
            
            if (closeTransactionModal) {
                closeTransactionModal.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.hideModal('transactionModal');
                });
            }
            
            if (cancelTransactionBtn) {
                cancelTransactionBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.hideModal('transactionModal');
                });
            }

            // Budget modal
            const closeBudgetModal = document.getElementById('closeBudgetModal');
            const cancelBudgetBtn = document.getElementById('cancelBudgetBtn');
            
            if (closeBudgetModal) {
                closeBudgetModal.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.hideModal('budgetModal');
                });
            }
            
            if (cancelBudgetBtn) {
                cancelBudgetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.hideModal('budgetModal');
                });
            }

            // Click outside modal to close
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideModal(modal.id);
                    }
                });
            });
        } catch (error) {
            console.error('Error setting up modal controls:', error);
        }
    }

    toggleTheme() {
        try {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            this.setTheme(this.theme);
            this.saveData('theme', this.theme);
            this.showToast(`Switched to ${this.theme} theme`);
        } catch (error) {
            console.error('Error toggling theme:', error);
        }
    }

    setTheme(theme) {
        try {
            document.documentElement.setAttribute('data-color-scheme', theme);
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
            }
        } catch (error) {
            console.error('Error setting theme:', error);
        }
    }

    showTab(tabName) {
        try {
            console.log('Showing tab:', tabName);
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });

            // Remove active class from nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });

            // Show selected tab
            const selectedTab = document.getElementById(tabName);
            const selectedNav = document.querySelector(`[data-tab="${tabName}"]`);
            
            if (selectedTab) {
                selectedTab.classList.add('active');
                console.log('Tab activated:', tabName);
            }
            if (selectedNav) {
                selectedNav.classList.add('active');
                console.log('Nav activated:', tabName);
            }

            // Refresh content based on tab
            if (tabName === 'analytics') {
                setTimeout(() => this.updateCharts(), 100);
            }
        } catch (error) {
            console.error('Error showing tab:', error);
        }
    }

    populateSelects() {
        try {
            // Populate category filters
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>';
                
                const allCategories = [...this.categories.income, ...this.categories.expense];
                [...new Set(allCategories)].forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categoryFilter.appendChild(option);
                });
            }

            // Populate budget category select
            const budgetCategorySelect = document.getElementById('budgetCategory');
            if (budgetCategorySelect) {
                budgetCategorySelect.innerHTML = '<option value="">Select Category</option>';
                this.categories.expense.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    budgetCategorySelect.appendChild(option);
                });
            }

            // Set current date for transaction form
            const transactionDate = document.getElementById('transactionDate');
            if (transactionDate) {
                transactionDate.value = new Date().toISOString().split('T')[0];
            }
        } catch (error) {
            console.error('Error populating selects:', error);
        }
    }

    populateCategories(type) {
        try {
            const categorySelect = document.getElementById('transactionCategory');
            if (!categorySelect) return;
            
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            
            if (type && this.categories[type]) {
                this.categories[type].forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error populating categories:', error);
        }
    }

    updateDashboard() {
        try {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyTransactions = this.transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            });

            const monthlyIncome = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const monthlyExpenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const netSavings = monthlyIncome - monthlyExpenses;

            const currentBalanceEl = document.getElementById('currentBalance');
            const monthlyIncomeEl = document.getElementById('monthlyIncome');
            const monthlyExpensesEl = document.getElementById('monthlyExpenses');
            const netSavingsEl = document.getElementById('netSavings');

            if (currentBalanceEl) currentBalanceEl.textContent = this.formatCurrency(this.currentBalance);
            if (monthlyIncomeEl) monthlyIncomeEl.textContent = this.formatCurrency(monthlyIncome);
            if (monthlyExpensesEl) monthlyExpensesEl.textContent = this.formatCurrency(monthlyExpenses);
            if (netSavingsEl) {
                netSavingsEl.textContent = this.formatCurrency(netSavings);
                netSavingsEl.className = netSavings >= 0 ? 'amount positive' : 'amount negative';
            }

            this.displayRecentTransactions();
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    displayRecentTransactions() {
        try {
            const recentTransactions = this.transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            const container = document.getElementById('recentTransactionsList');
            if (!container) return;

            container.innerHTML = '';

            recentTransactions.forEach(transaction => {
                const item = document.createElement('div');
                item.className = 'transaction-item';
                item.innerHTML = `
                    <div class="transaction-info">
                        <div class="transaction-category">${transaction.category}</div>
                        <div class="transaction-description">${transaction.description}</div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'expense' ? '-' : '+'}${this.formatCurrency(transaction.amount)}
                    </div>
                `;
                container.appendChild(item);
            });
        } catch (error) {
            console.error('Error displaying recent transactions:', error);
        }
    }

    displayAIInsights() {
        try {
            const container = document.getElementById('aiInsightsList');
            if (!container) return;

            container.innerHTML = '';

            this.aiInsights.forEach(insight => {
                const item = document.createElement('div');
                item.className = 'insight-item';
                item.textContent = insight;
                container.appendChild(item);
            });
        } catch (error) {
            console.error('Error displaying AI insights:', error);
        }
    }

    showTransactionModal(type = '') {
        try {
            console.log('Showing transaction modal for type:', type);
            const modal = document.getElementById('transactionModal');
            const title = document.getElementById('transactionModalTitle');
            const form = document.getElementById('transactionForm');
            
            if (!modal || !form) {
                console.error('Transaction modal or form not found');
                return;
            }

            form.reset();
            this.editingTransactionId = null;
            
            if (type) {
                const typeSelect = document.getElementById('transactionType');
                if (typeSelect) {
                    typeSelect.value = type;
                    this.populateCategories(type);
                }
                if (title) {
                    title.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
                }
            } else {
                if (title) title.textContent = 'Add Transaction';
            }

            const dateInput = document.getElementById('transactionDate');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }

            modal.classList.remove('hidden');
            console.log('Transaction modal shown');
        } catch (error) {
            console.error('Error showing transaction modal:', error);
        }
    }

    showBudgetModal() {
        try {
            console.log('Showing budget modal');
            const modal = document.getElementById('budgetModal');
            const form = document.getElementById('budgetForm');
            
            if (!modal || !form) {
                console.error('Budget modal or form not found');
                return;
            }

            form.reset();
            modal.classList.remove('hidden');
            console.log('Budget modal shown');
        } catch (error) {
            console.error('Error showing budget modal:', error);
        }
    }

    hideModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                console.log('Modal hidden:', modalId);
            }
        } catch (error) {
            console.error('Error hiding modal:', error);
        }
    }

    handleTransactionSubmit(e) {
        e.preventDefault();
        
        try {
            const transaction = {
                id: this.editingTransactionId || Date.now(),
                type: document.getElementById('transactionType').value,
                amount: parseFloat(document.getElementById('transactionAmount').value),
                category: document.getElementById('transactionCategory').value,
                description: document.getElementById('transactionDescription').value,
                date: document.getElementById('transactionDate').value
            };

            if (this.editingTransactionId) {
                const index = this.transactions.findIndex(t => t.id === this.editingTransactionId);
                if (index !== -1) {
                    this.transactions[index] = transaction;
                    this.showToast('Transaction updated successfully!');
                }
            } else {
                this.transactions.push(transaction);
                this.showToast('Transaction added successfully!');
            }

            this.saveData('transactions', this.transactions);
            this.updateDashboard();
            this.updateTransactionsTable();
            this.updateBudgetDisplay();
            this.hideModal('transactionModal');
        } catch (error) {
            console.error('Error handling transaction submit:', error);
            this.showToast('Error saving transaction', 'error');
        }
    }

    handleBudgetSubmit(e) {
        e.preventDefault();
        
        try {
            const category = document.getElementById('budgetCategory').value;
            const limit = parseFloat(document.getElementById('budgetLimit').value);

            if (!category || !limit) {
                this.showToast('Please fill all fields', 'error');
                return;
            }

            const existingBudget = this.budgets.find(b => b.category === category);
            if (existingBudget) {
                existingBudget.limit = limit;
            } else {
                this.budgets.push({
                    category: category,
                    limit: limit,
                    spent: this.calculateCategorySpending(category)
                });
            }

            this.saveData('budgets', this.budgets);
            this.updateBudgetDisplay();
            this.showToast('Budget set successfully!');
            this.hideModal('budgetModal');
        } catch (error) {
            console.error('Error handling budget submit:', error);
            this.showToast('Error saving budget', 'error');
        }
    }

    calculateCategorySpending(category) {
        try {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            return this.transactions
                .filter(t => {
                    const tDate = new Date(t.date);
                    return t.type === 'expense' && 
                           t.category === category && 
                           tDate.getMonth() === currentMonth && 
                           tDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + t.amount, 0);
        } catch (error) {
            console.error('Error calculating category spending:', error);
            return 0;
        }
    }

    updateBudgetDisplay() {
        try {
            const container = document.getElementById('budgetList');
            if (!container) return;

            container.innerHTML = '';

            this.budgets.forEach((budget, index) => {
                budget.spent = this.calculateCategorySpending(budget.category);
                const percentage = (budget.spent / budget.limit) * 100;
                
                let progressClass = 'safe';
                if (percentage >= 100) progressClass = 'danger';
                else if (percentage >= 80) progressClass = 'warning';

                const item = document.createElement('div');
                item.className = 'budget-item';
                item.innerHTML = `
                    <div class="budget-header">
                        <div class="budget-category">${budget.category}</div>
                        <div class="budget-amounts">
                            ${this.formatCurrency(budget.spent)} / ${this.formatCurrency(budget.limit)}
                        </div>
                    </div>
                    <div class="budget-progress">
                        <div class="budget-progress-bar ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="budget-percentage">${percentage.toFixed(1)}% used</div>
                `;
                container.appendChild(item);
            });

            this.saveData('budgets', this.budgets);
        } catch (error) {
            console.error('Error updating budget display:', error);
        }
    }

    updateTransactionsTable() {
        try {
            const tbody = document.getElementById('transactionsTableBody');
            if (!tbody) return;

            const typeFilter = document.getElementById('typeFilter')?.value || '';
            const categoryFilter = document.getElementById('categoryFilter')?.value || '';
            const searchFilter = document.getElementById('searchFilter')?.value.toLowerCase() || '';

            let filteredTransactions = this.transactions.filter(transaction => {
                return (!typeFilter || transaction.type === typeFilter) &&
                       (!categoryFilter || transaction.category === categoryFilter) &&
                       (!searchFilter || 
                        transaction.description.toLowerCase().includes(searchFilter) ||
                        transaction.category.toLowerCase().includes(searchFilter));
            });

            filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            tbody.innerHTML = '';
            filteredTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.formatDate(transaction.date)}</td>
                    <td><span class="transaction-type ${transaction.type}">${transaction.type}</span></td>
                    <td>${transaction.category}</td>
                    <td>${transaction.description}</td>
                    <td class="${transaction.type}">
                        ${transaction.type === 'expense' ? '-' : '+'}${this.formatCurrency(transaction.amount)}
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn--outline btn-icon" onclick="financeManager.editTransaction(${transaction.id})">✏️</button>
                            <button class="btn btn--outline btn-icon" onclick="financeManager.deleteTransaction(${transaction.id})">🗑️</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error updating transactions table:', error);
        }
    }

    editTransaction(id) {
        try {
            const transaction = this.transactions.find(t => t.id === id);
            if (!transaction) return;

            this.editingTransactionId = id;
            
            document.getElementById('transactionType').value = transaction.type;
            this.populateCategories(transaction.type);
            document.getElementById('transactionAmount').value = transaction.amount;
            document.getElementById('transactionCategory').value = transaction.category;
            document.getElementById('transactionDescription').value = transaction.description;
            document.getElementById('transactionDate').value = transaction.date;
            
            document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
            document.getElementById('transactionModal').classList.remove('hidden');
        } catch (error) {
            console.error('Error editing transaction:', error);
        }
    }

    deleteTransaction(id) {
        try {
            if (confirm('Are you sure you want to delete this transaction?')) {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.saveData('transactions', this.transactions);
                this.updateDashboard();
                this.updateTransactionsTable();
                this.updateBudgetDisplay();
                this.showToast('Transaction deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    }

    initializeCharts() {
        try {
            this.expensePieChart = null;
            this.incomeExpenseChart = null;
            setTimeout(() => this.updateCharts(), 100);
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    updateCharts() {
        try {
            this.updateExpensePieChart();
            this.updateIncomeExpenseChart();
            this.updateSpendingInsights();
            this.updateFinancialHealth();
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    updateExpensePieChart() {
        try {
            const canvas = document.getElementById('expensePieChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            
            if (this.expensePieChart) {
                this.expensePieChart.destroy();
            }

            const expensesByCategory = {};
            this.transactions
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
                });

            const labels = Object.keys(expensesByCategory);
            const data = Object.values(expensesByCategory);
            const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325'];

            if (labels.length === 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#666';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('No expense data available', canvas.width / 2, canvas.height / 2);
                return;
            }

            this.expensePieChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating expense pie chart:', error);
        }
    }

    updateIncomeExpenseChart() {
        try {
            const canvas = document.getElementById('incomeExpenseChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            
            if (this.incomeExpenseChart) {
                this.incomeExpenseChart.destroy();
            }

            // Get last 6 months data
            const monthlyData = {};
            const currentDate = new Date();
            
            for (let i = 5; i >= 0; i--) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const monthKey = date.toISOString().substring(0, 7);
                monthlyData[monthKey] = { income: 0, expense: 0 };
            }

            this.transactions.forEach(t => {
                const monthKey = t.date.substring(0, 7);
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey][t.type] += t.amount;
                }
            });

            const labels = Object.keys(monthlyData).map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            });

            const incomeData = Object.values(monthlyData).map(d => d.income);
            const expenseData = Object.values(monthlyData).map(d => d.expense);

            this.incomeExpenseChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Expenses',
                        data: expenseData,
                        borderColor: '#B4413C',
                        backgroundColor: 'rgba(180, 65, 60, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString('en-IN');
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating income expense chart:', error);
        }
    }

    updateSpendingInsights() {
        try {
            const container = document.getElementById('spendingInsights');
            if (!container) return;

            const totalTransactions = this.transactions.length;
            const avgAmount = totalTransactions > 0 ? 
                this.transactions.reduce((sum, t) => sum + t.amount, 0) / totalTransactions : 0;
            
            const expenseAmounts = this.transactions.filter(t => t.type === 'expense').map(t => t.amount);
            const largestExpense = expenseAmounts.length > 0 ? Math.max(...expenseAmounts) : 0;
            
            const insights = [
                `Total transactions: ${totalTransactions}`,
                `Average transaction: ${this.formatCurrency(avgAmount)}`,
                `Largest expense: ${this.formatCurrency(largestExpense)}`,
                `Most frequent category: ${this.getMostFrequentCategory()}`
            ];

            container.innerHTML = insights.map(insight => `<p>${insight}</p>`).join('');
        } catch (error) {
            console.error('Error updating spending insights:', error);
        }
    }

    getMostFrequentCategory() {
        try {
            if (this.transactions.length === 0) return 'None';
            
            const categoryCount = {};
            this.transactions.forEach(t => {
                categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
            });
            
            return Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b);
        } catch (error) {
            console.error('Error getting most frequent category:', error);
            return 'None';
        }
    }

    updateFinancialHealth() {
        try {
            const monthlyIncome = this.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const monthlyExpenses = this.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
            const score = Math.min(Math.max(savingsRate * 4, 0), 100);

            const scoreElement = document.getElementById('healthScore');
            if (scoreElement) {
                scoreElement.textContent = Math.round(score);
            }
            
            const tips = [
                score > 80 ? "Excellent financial health!" : "Room for improvement in savings",
                "Consider increasing your emergency fund",
                "Review and optimize your budget regularly"
            ];

            const tipsElement = document.getElementById('healthTips');
            if (tipsElement) {
                tipsElement.innerHTML = tips.map(tip => `<p>• ${tip}</p>`).join('');
            }
        } catch (error) {
            console.error('Error updating financial health:', error);
        }
    }

    handleChatMessage() {
        try {
            const input = document.getElementById('chatInput');
            if (!input) return;
            
            const message = input.value.trim();
            if (!message) return;

            this.addChatMessage(message, 'user');
            input.value = '';

            // Process AI response
            setTimeout(() => {
                const response = this.getAIResponse(message);
                this.addChatMessage(response, 'ai');
            }, 500);
        } catch (error) {
            console.error('Error handling chat message:', error);
        }
    }

    addChatMessage(message, type) {
        try {
            const container = document.getElementById('chatMessages');
            if (!container) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `${type}-message`;
            messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
            container.appendChild(messageDiv);
            container.scrollTop = container.scrollHeight;
        } catch (error) {
            console.error('Error adding chat message:', error);
        }
    }

    getAIResponse(message) {
        try {
            const lowerMessage = message.toLowerCase();
            
            // Check for keywords
            for (const [keyword, response] of Object.entries(this.aiKeywords)) {
                if (lowerMessage.includes(keyword)) {
                    return response;
                }
            }

            // Default responses
            const defaultResponses = [
                "I'm here to help with your financial questions! Try asking about spending, budget, savings, or investments.",
                "For better assistance, use keywords like 'spending', 'budget', 'save', 'investment', etc.",
                "I can provide insights about your financial health, spending patterns, and saving strategies."
            ];

            return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        } catch (error) {
            console.error('Error getting AI response:', error);
            return "I'm having trouble processing your request. Please try again.";
        }
    }

    exportData() {
        try {
            // Convert to CSV for transactions
            let csv = 'Date,Type,Category,Description,Amount\n';
            this.transactions.forEach(t => {
                csv += `${t.date},${t.type},${t.category},"${t.description}",${t.amount}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'financial_data.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showToast('Data exported successfully!');
            this.speak('Your financial data has been exported successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Error exporting data', 'error');
        }
    }

    showToast(message, type = 'success') {
        try {
            const container = document.getElementById('toastContainer');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            container.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 3000);
        } catch (error) {
            console.error('Error showing toast:', error);
        }
    }

    formatCurrency(amount) {
        try {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0
            }).format(amount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return `₹${amount}`;
        }
    }

    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('en-IN');
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    }

    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }
}

// Initialize the application
window.financeManager = new FinanceManager();