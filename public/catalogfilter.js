        document.addEventListener('DOMContentLoaded', function() {
            class CatalogFilter {
                constructor() {
                    this.currentMainCategory = null;
                    this.currentSubCategory = null;
                    this.visibleCount = 12;
                    this.currentSort = 'default';
                    this.allProducts = [];
                    this.originalOrder = [];
                    
                    this.init();
                }
                
                init() {
                    console.log('Инициализация фильтра каталога...');
                    
                    this.collectProducts();
                    this.setupFilters();
                    this.setupSorting();
                    this.setupPagination();
                    this.renderProducts();
                    this.showAllProducts();
                }
                
                collectProducts() {
                    const productElements = document.querySelectorAll('.collection__item');
                    console.log('Найдено товаров:', productElements.length);
                    
                    productElements.forEach((item, index) => {
                        this.originalOrder.push(item);
                        
                        if (!item.hasAttribute('data-category')) {
                            const title = item.getAttribute('data-title') || '';
                            const imgSrc = item.querySelector('img')?.src || '';
                            
                            if (title.includes('Кепка') || imgSrc.includes('cap_')) {
                                item.setAttribute('data-category', 'accessories');
                                item.setAttribute('data-subcategory', 'cap');
                            } else if (title.includes('Значок') || imgSrc.includes('pin_')) {
                                item.setAttribute('data-category', 'accessories');
                                item.setAttribute('data-subcategory', 'pin');
                            } else if (title.includes('Свитшот') || imgSrc.includes('sweatshirt')) {
                                item.setAttribute('data-category', 'clothing');
                                item.setAttribute('data-subcategory', 'sweatshirt');
                            } else if (title.includes('Худи') || imgSrc.includes('hoodie')) {
                                item.setAttribute('data-category', 'clothing');
                                item.setAttribute('data-subcategory', 'hoodie');
                            } else if (title.includes('Шоппер') || imgSrc.includes('bag_')) {
                                item.setAttribute('data-category', 'accessories');
                                item.setAttribute('data-subcategory', 'shopper');
                            } else if (title.includes('Постер') || imgSrc.includes('poster_')) {
                                item.setAttribute('data-category', 'other');
                                item.setAttribute('data-subcategory', 'poster');
                            } else if (title.includes('Чехол') || imgSrc.includes('case')) {
                                item.setAttribute('data-category', 'other');
                                item.setAttribute('data-subcategory', 'case');
                            }
                        }
                        
                        const priceText = item.querySelector('[product-info="cost"]')?.textContent || '0';
                        const price = parseInt(priceText.replace(/\D/g, ''));
                        item.setAttribute('data-price', price);
                        
                        this.allProducts.push(item);
                    });
                    
                    console.log('Все товары собраны:', this.allProducts.length);
                }
                
                setupFilters() {
                    const filterElements = document.querySelectorAll('.category-main, .subcategory');
                    
                    filterElements.forEach(filter => {
                        filter.addEventListener('click', (e) => {
                            e.preventDefault();
                            
                            const category = filter.getAttribute('data-category');
                            const filterType = filter.getAttribute('data-filter-type');
                            
                            console.log('Фильтр кликнут:', category, 'тип:', filterType);
                            
                            document.querySelectorAll('.category-main.active, .subcategory.active').forEach(el => {
                                el.classList.remove('active');
                            });
                            
                            filter.classList.add('active');
                            
                            if (filterType === 'main') {
                                this.currentMainCategory = category;
                                this.currentSubCategory = null;
                            } else if (filterType === 'sub') {
                                this.currentSubCategory = category;
                                this.currentMainCategory = this.getMainCategoryBySub(category);
                            }
                            
                            this.visibleCount = 12;
                            this.renderProducts();
                        });
                    });
                }
                
                getMainCategoryBySub(subCategory) {
                    if (subCategory === 'hoodie' || subCategory === 'sweatshirt') {
                        return 'clothing';
                    } else if (subCategory === 'pin' || subCategory === 'cap' || subCategory === 'shopper') {
                        return 'accessories';
                    } else if (subCategory === 'poster' || subCategory === 'case') {
                        return 'other';
                    }
                    return null;
                }
                
                setupSorting() {
                    const sortSelect = document.querySelector('#isbkq2qu4_0');
                    
                    if (sortSelect) {
                        sortSelect.addEventListener('change', (e) => {
                            this.currentSort = e.target.value;
                            console.log('Сортировка изменена:', this.currentSort);
                            this.renderProducts();
                        });
                    }
                }
                
                setupPagination() {
                    const loadMoreBtn = document.querySelector('#i0hzsfewi_0');
                    
                    if (loadMoreBtn) {
                        loadMoreBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            console.log('Загрузить еще...');
                            this.loadMore();
                        });
                    }
                }
                
                loadMore() {
                    this.visibleCount += 12;
                    this.renderProducts();
                }
                
                showAllProducts() {
                    this.currentMainCategory = null;
                    this.currentSubCategory = null;
                    this.visibleCount = 12;
                    
                    document.querySelectorAll('.category-main.active, .subcategory.active').forEach(el => {
                        el.classList.remove('active');
                    });
                    
                    this.renderProducts();
                }
                
                getFilteredProducts() {
                    let filtered = [...this.allProducts];
                    
                    if (this.currentMainCategory) {
                        filtered = filtered.filter(item => 
                            item.getAttribute('data-category') === this.currentMainCategory
                        );
                        
                        if (this.currentSubCategory) {
                            filtered = filtered.filter(item => 
                                item.getAttribute('data-subcategory') === this.currentSubCategory
                            );
                        }
                    }
                    
                    console.log('Отфильтровано товаров:', filtered.length);
                    return this.applySorting(filtered);
                }
                
                applySorting(products) {
                    const sortedProducts = [...products];
                    
                    switch(this.currentSort) {
                        case 'По цене (по возрастанию)':
                            console.log('Сортировка по возрастанию цены');
                            return sortedProducts.sort((a, b) => {
                                const priceA = parseInt(a.getAttribute('data-price')) || 0;
                                const priceB = parseInt(b.getAttribute('data-price')) || 0;
                                return priceA - priceB;
                            });
                            
                        case 'По цене (по убыванию)':
                            console.log('Сортировка по убыванию цены');
                            return sortedProducts.sort((a, b) => {
                                const priceA = parseInt(a.getAttribute('data-price')) || 0;
                                const priceB = parseInt(b.getAttribute('data-price')) || 0;
                                return priceB - priceA;
                            });
                            
                        case 'По умолчанию':
                        default:
                            console.log('Сортировка по умолчанию');
                            return this.restoreOriginalOrder(products);
                    }
                }
                
                restoreOriginalOrder(filteredProducts) {
                    return this.originalOrder.filter(item => 
                        filteredProducts.includes(item)
                    );
                }
                
                renderProducts() {
                    const filteredProducts = this.getFilteredProducts();
                    const productsToShow = filteredProducts.slice(0, this.visibleCount);
                    
                    console.log('Рендеринг. Всего:', filteredProducts.length, 'Показать:', productsToShow.length);
                    
                    this.allProducts.forEach(item => {
                        item.style.display = 'none';
                        item.style.order = '';
                    });
                    
                    productsToShow.forEach((item, index) => {
                        item.style.display = 'block';
                        item.style.order = index;
                    });
                    
                    this.updateProductCount(filteredProducts.length);
                    this.updateLoadMoreButton(filteredProducts.length);
                }
                
                updateProductCount(total) {
                    const countElement = document.querySelector('.product-count');
                    if (countElement) {
                        countElement.textContent = `(${total} товаров)`;
                    }
                }
                
                updateLoadMoreButton(total) {
                    const loadMoreBtn = document.querySelector('#i0hzsfewi_0');
                    
                    if (loadMoreBtn) {
                        if (this.visibleCount >= total) {
                            loadMoreBtn.style.display = 'none';
                        } else {
                            loadMoreBtn.style.display = 'block';
                        }
                    }
                }
            }
            
            window.catalogFilter = new CatalogFilter();
        });