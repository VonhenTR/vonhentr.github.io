class BearFeedingGame {
    constructor() {
        this.score = 0;
        this.bears = [];
        this.gameArea = document.getElementById('gameArea');
        this.scoreElement = document.getElementById('score');
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.setupBears();
        this.setupDragAndDrop();
        this.startContinuousMovement();
    }
    
    setupBears() {
        const bearElements = document.querySelectorAll('.bear');
        bearElements.forEach((bearEl, index) => {
            const bear = {
                element: bearEl,
                name: bearEl.dataset.name,
                homeX: parseFloat(bearEl.style.left),
                homeY: parseFloat(bearEl.style.top),
                currentX: parseFloat(bearEl.style.left),
                currentY: parseFloat(bearEl.style.top),
                targetX: parseFloat(bearEl.style.left),
                targetY: parseFloat(bearEl.style.top),
                velocityX: 0,
                velocityY: 0,
                baseSpeed: 0.008 + Math.random() * 0.004, // Daha sabit temel hız
                currentSpeed: 0,
                moveRange: 15 + Math.random() * 10, // Hareket alanı
                lastDirectionChange: 0,
                directionChangeInterval: 3000 + Math.random() * 4000, // 3-7 saniye
                lastFed: 0,
                isMoving: true,
                // Yeni özellikler - daha gerçekçi hareket için
                walkCycle: Math.random() * Math.PI * 2, // Yürüyüş döngüsü
                pauseTime: 0,
                isPaused: false,
                smoothness: 0.98, // Hareket yumuşaklığı
                acceleration: 0.002,
                targetReachedThreshold: 2 // Hedefe yakınlık eşiği
            };
            
            bear.currentSpeed = bear.baseSpeed;
            this.setNewTarget(bear);
            this.bears.push(bear);
        });
    }
    
    setNewTarget(bear) {
        // Bazen evine yakın, bazen biraz uzak hedefler seç
        const stayNearHome = Math.random() < 0.7; // %70 evine yakın
        
        if (stayNearHome) {
            // Ev çevresinde küçük hareket
            const angle = Math.random() * Math.PI * 2;
            const distance = 3 + Math.random() * 8;
            
            bear.targetX = bear.homeX + Math.cos(angle) * distance;
            bear.targetY = bear.homeY + Math.sin(angle) * distance;
        } else {
            // Bazen daha uzak keşif
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * bear.moveRange;
            
            bear.targetX = bear.homeX + Math.cos(angle) * distance;
            bear.targetY = bear.homeY + Math.sin(angle) * distance;
        }
        
        // Oyun alanı sınırları içinde tut
        bear.targetX = Math.max(5, Math.min(80, bear.targetX));
        bear.targetY = Math.max(8, Math.min(70, bear.targetY));
        
        // Yeni hedef belirlendiğinde duraksamayı sıfırla
        bear.isPaused = false;
        bear.pauseTime = 0;
    }
    
    startContinuousMovement() {
        const animate = (currentTime) => {
            this.bears.forEach(bear => {
                this.updateBearPosition(bear, currentTime);
            });
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    updateBearPosition(bear, currentTime) {
        if (!bear.isMoving) return;
        
        // Rastgele duraksama (gerçekçi davranış)
        if (!bear.isPaused && Math.random() < 0.002) { // %0.2 şans duraksama
            bear.isPaused = true;
            bear.pauseTime = currentTime + 500 + Math.random() * 1500; // 0.5-2 saniye duraklama
            return;
        }
        
        // Duraklama kontrolü
        if (bear.isPaused) {
            if (currentTime < bear.pauseTime) {
                // Duraklama sırasında hafif sallanma
                bear.walkCycle += 0.1;
                const wobble = Math.sin(bear.walkCycle) * 0.1;
                bear.element.style.transform = `translateX(${wobble}px)`;
                return;
            } else {
                bear.isPaused = false;
                bear.element.style.transform = '';
            }
        }
        
        // Hedefe olan mesafe
        const deltaX = bear.targetX - bear.currentX;
        const deltaY = bear.targetY - bear.currentY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Hedefe yaklaştıysa veya yön değiştirme zamanı geldiyse
        if (distance < bear.targetReachedThreshold || 
            currentTime - bear.lastDirectionChange > bear.directionChangeInterval) {
            
            this.setNewTarget(bear);
            bear.lastDirectionChange = currentTime;
            bear.directionChangeInterval = 3000 + Math.random() * 4000;
            
            // Yön değişiminde kısa duraksa
            bear.isPaused = true;
            bear.pauseTime = currentTime + 200 + Math.random() * 600;
            return;
        }
        
        // Hız ayarlaması - hedefe yaklaştıkça yavaşla
        const distanceFactor = Math.min(1, distance / 10);
        const targetSpeed = bear.baseSpeed * distanceFactor;
        
        // Yumuşak hız geçişi
        bear.currentSpeed += (targetSpeed - bear.currentSpeed) * 0.1;
        
        // Yön hesaplama
        const normalizedDeltaX = distance > 0 ? deltaX / distance : 0;
        const normalizedDeltaY = distance > 0 ? deltaY / distance : 0;
        
        // İvme ile hareket (daha yumuşak)
        bear.velocityX += normalizedDeltaX * bear.acceleration;
        bear.velocityY += normalizedDeltaY * bear.acceleration;
        
        // Sürtünme ve hız sınırlaması
        bear.velocityX *= bear.smoothness;
        bear.velocityY *= bear.smoothness;
        
        const maxSpeed = bear.currentSpeed * 2;
        const currentVelocity = Math.sqrt(bear.velocityX * bear.velocityX + bear.velocityY * bear.velocityY);
        
        if (currentVelocity > maxSpeed) {
            bear.velocityX = (bear.velocityX / currentVelocity) * maxSpeed;
            bear.velocityY = (bear.velocityY / currentVelocity) * maxSpeed;
        }
        
        // Pozisyonu güncelle
        bear.currentX += bear.velocityX;
        bear.currentY += bear.velocityY;
        
        // Sınır kontrolü - yumuşak geri sekme
        if (bear.currentX < 5) {
            bear.currentX = 5;
            bear.velocityX = Math.abs(bear.velocityX) * 0.3;
            this.setNewTarget(bear);
        }
        if (bear.currentX > 80) {
            bear.currentX = 80;
            bear.velocityX = -Math.abs(bear.velocityX) * 0.3;
            this.setNewTarget(bear);
        }
        if (bear.currentY < 8) {
            bear.currentY = 8;
            bear.velocityY = Math.abs(bear.velocityY) * 0.3;
            this.setNewTarget(bear);
        }
        if (bear.currentY > 70) {
            bear.currentY = 70;
            bear.velocityY = -Math.abs(bear.velocityY) * 0.3;
            this.setNewTarget(bear);
        }
        
        // Yürüyüş animasyonu (hafif sallanma)
        bear.walkCycle += bear.currentSpeed * 50;
        const walkBob = Math.sin(bear.walkCycle) * 0.5;
        
        // DOM'u güncelle
        bear.element.style.left = bear.currentX + '%';
        bear.element.style.top = bear.currentY + '%';
        bear.element.style.transform = `translateY(${walkBob}px)`;
    }
    
    setupDragAndDrop() {
        const foods = document.querySelectorAll('.food');
        
        foods.forEach(food => {
            food.addEventListener('dragstart', this.handleDragStart.bind(this));
            food.addEventListener('dragend', this.handleDragEnd.bind(this));
        });
        
        // Ayıcıklara drop event'leri ekle
        this.bears.forEach(bear => {
            bear.element.addEventListener('dragover', this.handleDragOver.bind(this));
            bear.element.addEventListener('drop', this.handleDrop.bind(this));
        });
        
        // Touch events for mobile
        foods.forEach(food => {
            food.addEventListener('touchstart', this.handleTouchStart.bind(this));
            food.addEventListener('touchmove', this.handleTouchMove.bind(this));
            food.addEventListener('touchend', this.handleTouchEnd.bind(this));
        });
    }
    
    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.target.classList.add('dragging');
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    handleDragOver(e) {
        e.preventDefault();
    }
    
    handleDrop(e) {
        e.preventDefault();
        const foodType = e.dataTransfer.getData('text/plain');
        const bearElement = e.currentTarget;
        const bear = this.bears.find(b => b.element === bearElement);
        
        if (bear) {
            this.feedBear(bear, foodType);
        }
    }
    
    // Touch events for mobile support
    handleTouchStart(e) {
        this.touchedFood = e.target;
        this.touchedFood.classList.add('dragging');
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (this.touchedFood) {
            const touch = e.touches[0];
            this.touchedFood.style.position = 'fixed';
            this.touchedFood.style.left = touch.clientX - 25 + 'px';
            this.touchedFood.style.top = touch.clientY - 25 + 'px';
            this.touchedFood.style.zIndex = '1000';
        }
    }
    
    handleTouchEnd(e) {
        if (this.touchedFood) {
            const touch = e.changedTouches[0];
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // Reset food position
            this.touchedFood.style.position = '';
            this.touchedFood.style.left = '';
            this.touchedFood.style.top = '';
            this.touchedFood.style.zIndex = '';
            this.touchedFood.classList.remove('dragging');
            
            // Check if dropped on a bear
            const bearElement = elementBelow?.closest('.bear');
            if (bearElement) {
                const bear = this.bears.find(b => b.element === bearElement);
                if (bear) {
                    this.feedBear(bear, this.touchedFood.dataset.type);
                }
            }
            
            this.touchedFood = null;
        }
    }
    
    feedBear(bear, foodType) {
        const now = Date.now();
        
        // Çok sık beslemeyi engelle
        if (now - bear.lastFed < 2000) {
            return;
        }
        
        bear.lastFed = now;
        
        // Puan ekle
        this.score += 10;
        this.updateScore();
        
        // Ayıcığı mutlu göster
        this.showHappiness(bear);
        
        // Beslenme animasyonu - hareketi durdur ve mutluluk göster
        bear.element.classList.add('feeding');
        bear.isMoving = false;
        bear.element.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            bear.element.classList.remove('feeding');
            bear.element.style.transform = '';
            bear.isMoving = true;
            // Yeni bir hedef belirle
            this.setNewTarget(bear);
        }, 1200);
        
        console.log(`${bear.name} ${foodType} ile beslendi!`);
    }
    
    showHappiness(bear) {
        const happinessEl = bear.element.querySelector('.happiness');
        const happyEmojis = ['😊', '🥰', '😋','💖'];
        
        happinessEl.textContent = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
        happinessEl.classList.add('show');
        
        setTimeout(() => {
            happinessEl.classList.remove('show');
        }, 1500);
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        
        // Puan animasyonu
        this.scoreElement.parentElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.scoreElement.parentElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Oyun durdurulduğunda animasyonu temizle
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Oyunu başlat
document.addEventListener('DOMContentLoaded', () => {
    new BearFeedingGame();
});

// Ekstra etkileşimler
document.addEventListener('DOMContentLoaded', () => {
    // Ayıcıklara tıklama efekti
    document.querySelectorAll('.bear').forEach(bear => {
        bear.addEventListener('click', function() {
            const emoji = this.querySelector('.bear-emoji');
            emoji.style.transform = 'scale(1.2) rotate(10deg)';
            setTimeout(() => {
                emoji.style.transform = '';
            }, 300);
        });
    });
    
    // Yiyeceklere hover efekti
    document.querySelectorAll('.food').forEach(food => {
        food.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(5deg)';
        });
        
        food.addEventListener('mouseleave', function() {
            if (!this.classList.contains('dragging')) {
                this.style.transform = '';
            }
        });
    });
});