class BearFeedingGame {
    constructor() {
        this.bears = [];
        this.gameArea = document.getElementById('gameArea');
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
                baseSpeed: 0.008 + Math.random() * 0.004,
                currentSpeed: 0,
                moveRange: 15 + Math.random() * 10,
                lastDirectionChange: 0,
                directionChangeInterval: 3000 + Math.random() * 4000,
                lastFed: 0,
                isMoving: true,
                walkCycle: Math.random() * Math.PI * 2,
                pauseTime: 0,
                isPaused: false,
                smoothness: 0.98,
                acceleration: 0.002,
                targetReachedThreshold: 2,
                // Yaş sistemi
                age: 1, // Başlangıç yaşı
                hungerLevel: 0, // 0-100 arası açlık seviyesi
                size: 0.7, // Başlangıç boyutu (küçük)
                maxSize: 1.3, // Maksimum boyut
                feedCount: 0, // Kaç kere beslendiği
                maxFeedCount: 15, // Maksimum beslenme sayısı
                ageStages: [
                    { age: 1, name: "Bebek", emoji: "👶", color: "#FFB6C1" },
                    { age: 3, name: "Çocuk", emoji: "🧒", color: "#98FB98" },
                    { age: 6, name: "Genç", emoji: "🧑", color: "#87CEEB" },
                    { age: 10, name: "Yetişkin", emoji: "🐻", color: "#FFD700" },
                    { age: 15, name: "Büyük", emoji: "🐻‍❄️", color: "#FF6347" }
                ]
            };
            
            bear.currentSpeed = bear.baseSpeed;
            this.setNewTarget(bear);
            this.updateBearSize(bear);
            this.updateBearAge(bear); // İlk yaş durumunu ayarla
            this.bears.push(bear);
        });
    }
    
    updateBearAge(bear) {
        // Beslenme sayısına göre yaş hesapla
        const newAge = 1 + Math.floor(bear.feedCount / 3); // Her 3 beslenme = 1 yaş
        bear.age = Math.min(newAge, 15); // Maksimum 15 yaş
        
        // Yaş aşamasını bul
        let currentStage = bear.ageStages[0];
        for (let stage of bear.ageStages) {
            if (bear.age >= stage.age) {
                currentStage = stage;
            }
        }
        
        // İsim etiketini güncelle
        const nameEl = bear.element.querySelector('.bear-name');
        if (nameEl) {
            nameEl.innerHTML = `${bear.name}<br><span style="font-size: 0.8rem; opacity: 0.9;">${bear.age} yaşında ${currentStage.name}</span>`;
            nameEl.style.background = `linear-gradient(45deg, ${currentStage.color}, rgba(255, 255, 255, 0.8))`;
            nameEl.style.borderColor = currentStage.color;
            nameEl.style.padding = '8px 15px';
            nameEl.style.lineHeight = '1.2';
        }
    }
    
    updateBearSize(bear) {
        // Yaşa göre boyut hesapla
        const ageProgress = Math.min((bear.age - 1) / 14, 1); // 1-15 yaş arası
        bear.size = 0.7 + (ageProgress * (bear.maxSize - 0.7));
        
        // SVG boyutunu güncelle
        const svg = bear.element.querySelector('.bear-emoji svg');
        if (svg) {
            const baseSize = window.innerWidth <= 768 ? 85 : 120;
            const newSize = baseSize * bear.size;
            svg.style.width = newSize + 'px';
            svg.style.height = newSize + 'px';
            svg.style.transition = 'all 0.5s ease';
        }
    }
    
    updateBearHunger() {
        this.bears.forEach(bear => {
            if (bear.hungerLevel < 100) {
                // Yaşlı ayıcıklar daha yavaş acıkır
                const hungerRate = 0.02 - (bear.age * 0.001);
                bear.hungerLevel += Math.max(hungerRate, 0.005);

                // Çok aç olan ayıcıklar daha hızlı hareket eder
                if (bear.hungerLevel > 70) {
                    bear.baseSpeed = 0.012 + Math.random() * 0.004;
                } else {
                    bear.baseSpeed = 0.008 + Math.random() * 0.004;
                }
            }
        });
    }

    setNewTarget(bear) {
        const stayNearHome = Math.random() < 0.7;

        if (stayNearHome) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 3 + Math.random() * 8;

            bear.targetX = bear.homeX + Math.cos(angle) * distance;
            bear.targetY = bear.homeY + Math.sin(angle) * distance;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * bear.moveRange;

            bear.targetX = bear.homeX + Math.cos(angle) * distance;
            bear.targetY = bear.homeY + Math.sin(angle) * distance;
        }

        bear.targetX = Math.max(5, Math.min(80, bear.targetX));
        bear.targetY = Math.max(8, Math.min(70, bear.targetY));

        bear.isPaused = false;
        bear.pauseTime = 0;
    }

    startContinuousMovement() {
        const animate = (currentTime) => {
            this.bears.forEach(bear => {
                this.updateBearPosition(bear, currentTime);
            });

            if (currentTime % 100 < 16) {
                this.updateBearHunger();
            }

            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    updateBearPosition(bear, currentTime) {
        if (!bear.isMoving) return;

        if (!bear.isPaused && Math.random() < 0.002) {
            bear.isPaused = true;
            bear.pauseTime = currentTime + 500 + Math.random() * 1500;
            return;
        }

        if (bear.isPaused) {
            if (currentTime < bear.pauseTime) {
                bear.walkCycle += 0.1;
                const wobble = Math.sin(bear.walkCycle) * 0.1;
                bear.element.style.transform = `translateX(${wobble}px)`;
                return;
            } else {
                bear.isPaused = false;
                bear.element.style.transform = '';
            }
        }

        const deltaX = bear.targetX - bear.currentX;
        const deltaY = bear.targetY - bear.currentY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < bear.targetReachedThreshold ||
            currentTime - bear.lastDirectionChange > bear.directionChangeInterval) {

            this.setNewTarget(bear);
            bear.lastDirectionChange = currentTime;
            bear.directionChangeInterval = 3000 + Math.random() * 4000;

            bear.isPaused = true;
            bear.pauseTime = currentTime + 200 + Math.random() * 600;
            return;
        }

        const distanceFactor = Math.min(1, distance / 10);
        const targetSpeed = bear.baseSpeed * distanceFactor;

        bear.currentSpeed += (targetSpeed - bear.currentSpeed) * 0.1;

        const normalizedDeltaX = distance > 0 ? deltaX / distance : 0;
        const normalizedDeltaY = distance > 0 ? deltaY / distance : 0;

        bear.velocityX += normalizedDeltaX * bear.acceleration;
        bear.velocityY += normalizedDeltaY * bear.acceleration;

        bear.velocityX *= bear.smoothness;
        bear.velocityY *= bear.smoothness;

        const maxSpeed = bear.currentSpeed * 2;
        const currentVelocity = Math.sqrt(bear.velocityX * bear.velocityX + bear.velocityY * bear.velocityY);

        if (currentVelocity > maxSpeed) {
            bear.velocityX = (bear.velocityX / currentVelocity) * maxSpeed;
            bear.velocityY = (bear.velocityY / currentVelocity) * maxSpeed;
        }

        bear.currentX += bear.velocityX;
        bear.currentY += bear.velocityY;

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

        bear.walkCycle += bear.currentSpeed * 50;
        const walkBob = Math.sin(bear.walkCycle) * 0.5;

        bear.element.style.left = bear.currentX + '%';
        bear.element.style.top = bear.currentY + '%';
        // Scale efekti kaldırıldı - sadece yürüme hareketi
        bear.element.style.transform = `translateY(${walkBob}px)`;
    }

    setupDragAndDrop() {
        const foods = document.querySelectorAll('.food');

        foods.forEach(food => {
            food.addEventListener('dragstart', this.handleDragStart.bind(this));
            food.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        this.bears.forEach(bear => {
            bear.element.addEventListener('dragover', this.handleDragOver.bind(this));
            bear.element.addEventListener('drop', this.handleDrop.bind(this));
        });

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

    handleTouchStart(e) {
        e.preventDefault();
        this.touchedFood = e.target.closest('.food');
        if (this.touchedFood) {
            this.touchedFood.classList.add('dragging');
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.touchedFood) {
            const touch = e.touches[0];

            if (!this.touchMoveRAF) {
                this.touchMoveRAF = requestAnimationFrame(() => {
                    if (this.touchedFood) {
                        // Yiyeceğin boyutunu al
                        const foodSize = this.touchedFood.offsetWidth || 65; // Mobilde genelde 65px
                        const halfSize = foodSize / 2;

                        // Yiyecek tam parmağın altında olacak şekilde konumlandır
                        this.touchedFood.style.position = 'fixed';
                        this.touchedFood.style.left = (touch.clientX - halfSize) + 'px';
                        this.touchedFood.style.top = (touch.clientY - halfSize) + 'px';
                        this.touchedFood.style.zIndex = '1000';
                        this.touchedFood.style.pointerEvents = 'none';
                    }
                    this.touchMoveRAF = null;
                });
            }
        }
    }

    handleTouchEnd(e) {
        if (this.touchedFood) {
            const touch = e.changedTouches[0];

            if (this.touchMoveRAF) {
                cancelAnimationFrame(this.touchMoveRAF);
                this.touchMoveRAF = null;
            }

            this.touchedFood.style.position = '';
            this.touchedFood.style.left = '';
            this.touchedFood.style.top = '';
            this.touchedFood.style.zIndex = '';
            this.touchedFood.style.pointerEvents = '';
            this.touchedFood.classList.remove('dragging');

            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            const bearElement = elementBelow?.closest('.bear');

            if (bearElement) {
                const bear = this.bears.find(b => b.element === bearElement);
                if (bear) {
                    this.feedBear(bear, this.touchedFood.dataset.type);
                    if (navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
                }
            }

            this.touchedFood = null;
        }
    }

    feedBear(bear, foodType) {
        const now = Date.now();
        
        if (now - bear.lastFed < 2000) {
            return;
        }
        
        bear.lastFed = now;
        
        // Açlığı azalt ve beslenme sayısını artır
        bear.hungerLevel = Math.max(0, bear.hungerLevel - 30);
        bear.feedCount++;
        
        // Yaşı ve boyutu güncelle
        this.updateBearAge(bear);
        this.updateBearSize(bear);
        
        // Mutluluk göster
        this.showHappiness(bear);
        
        // Beslenme animasyonu - sadece CSS class, boyut değişimi yok
        bear.element.classList.add('feeding');
        bear.isMoving = false;
        
        setTimeout(() => {
            bear.element.classList.remove('feeding');
            bear.isMoving = true;
            this.setNewTarget(bear);
        }, 1200);
        
        // Yaş aşaması geçişi kontrol et
        if (bear.feedCount % 3 === 0) {
            this.showAgeUpMessage(bear);
        }
        
        console.log(`${bear.name} ${foodType} ile beslendi! Yaş: ${bear.age}, Beslenme: ${bear.feedCount}`);
    }
    
    showAgeUpMessage(bear) {
        const ageUpEmojis = ['🎂', '🎉', '✨', '🌟', '🎈'];
        const happinessEl = bear.element.querySelector('.happiness');

        happinessEl.textContent = ageUpEmojis[Math.floor(Math.random() * ageUpEmojis.length)];
        happinessEl.style.fontSize = '2.5rem';
        happinessEl.classList.add('show');

        setTimeout(() => {
            happinessEl.classList.remove('show');
            happinessEl.style.fontSize = '2rem';
        }, 2000);
    }

    showHappiness(bear) {
        const happinessEl = bear.element.querySelector('.happiness');
        const happyEmojis = ['😊', '🥰', '😋', '💖'];

        happinessEl.textContent = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
        happinessEl.classList.add('show');

        setTimeout(() => {
            happinessEl.classList.remove('show');
        }, 1500);
    }

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
    document.querySelectorAll('.bear').forEach(bear => {
        bear.addEventListener('click', function () {
            const emoji = this.querySelector('.bear-emoji');
            emoji.style.transform = 'scale(1.1)';
            setTimeout(() => {
                emoji.style.transform = '';
            }, 200);
        });
    });

    if (window.innerWidth > 768) {
        document.querySelectorAll('.food').forEach(food => {
            food.addEventListener('mouseenter', function () {
                this.style.transform = 'scale(1.05)';
            });

            food.addEventListener('mouseleave', function () {
                if (!this.classList.contains('dragging')) {
                    this.style.transform = '';
                }
            });
        });
    }

    document.addEventListener('touchmove', function (e) {
        if (e.target.closest('.food')) {
            e.preventDefault();
        }
    }, { passive: false });
});