ymaps.ready(() => {

    class Route {
        constructor(value, coords) {
            this.value = value;
            this.coords = coords;
            this.id = ++Route.idCounter;
        }
    }

    Route.idCounter = 0;

    let routes = [];
    let routesList = document.getElementById('routesList');
    let myCollection = new ymaps.GeoObjectCollection();

    // Создаём карту

    let myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],
        zoom: 10,
        controls: []
    });

    // Получаем значение и координаты новой точки +

    document.getElementById('routeInput').addEventListener('keypress', getCoords);

    function getCoords(e) {

        if (e.keyCode === 13) {
            let value = e.target.value;
            let myGeoCoder = ymaps.geocode(value);
            myGeoCoder.then(
                function (res) {
                    addNewRoute(value, res.geoObjects.get(0).geometry.getCoordinates());
                },
                function (err) {
                    console.log('Ошибка');
                }
            );
            e.target.value = '';
        }
    }

    // Добавление новой точки маршрута +

    function addNewRoute(value, coords) {
        routes.push(new Route(value, coords));
        myMap.setCenter(coords);
        renderList();
        renderMap();
    }

    // Рендерим список +

    function renderList() {
        routesList.innerHTML = '';
        for (let i = 0; i < routes.length; i++) {
            let li = document.createElement('li');
            let btn = document.createElement('button');
            btn.classList.add('delete');
            btn.addEventListener('click', deleteRoute);
            li.innerHTML = routes[i].value;
            li.append(btn);
            routesList.appendChild(li);
        }

        dragListOn();
    }

    // Перетаскивание списка +

    function dragListOn() {
        let sortable = Sortable.create(routesList, {
            onEnd: function (e) {
                let temp = routes[e.oldIndex];
                routes[e.oldIndex] = routes[e.newIndex];
                routes[e.newIndex] = temp;
                renderMap();
                renderList();
            },
        });
    }

    // Рендерим карту +

    function renderMap() {
        myCollection.removeAll();
        for (let i = 0; i < routes.length; i++) {
            let placeMark = new ymaps.Placemark(routes[i].coords, {
                balloonContent: routes[i].value
            }, {
                draggable: true,
            });
            placeMark.events.add('dragend', (e) => {
                onDragRedraw(e);
            });

            myCollection.add(placeMark);
        }

        if (routes.length > 1) {
            drawRoute();
        }

        myMap.geoObjects.add(myCollection);
    }

    // Перетаскивание на карте +

    function onDragRedraw(e) {
        let newCoords = e.get('target').geometry._coordinates;
        let value = e.get('target').properties._data.balloonContent;
        let newValue;
        let myGeoCoder = ymaps.geocode(newCoords);
        myGeoCoder.then(
            function (res) {
                newValue = res.geoObjects.get(0).getAddressLine();
                routes.forEach((item) => {
                    if (item.value === value) {
                        item.coords = newCoords;
                        item.value = newValue;
                        renderMap();
                        renderList();
                    }
                })
            },
            function (err) {
                console.log('Ошибка');
            }
        );
    }

    // Рисуем маршрут +

    function drawRoute() {
        let coords = [];
        for (let i = 0; i < routes.length; i++) {
            coords.push(routes[i].coords);
        }
        myCollection.add(new ymaps.Polyline(coords));
    }

    // Удаление по кнопке +

    function deleteRoute(e) {
        routes = routes.filter((route) => {
            return route.value !== e.target.parentElement.innerText;
        });
        renderList();
        renderMap();
    }

});



