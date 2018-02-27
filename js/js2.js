// Старт приложения

ymaps.ready(() => {

    class Model {
        constructor() {
            this._routes = [];
            this._geoCollection = new ymaps.GeoObjectCollection();
        }

        get routes() {
            return this._routes;
        }

        get geoCollection() {
            return this._geoCollection;
        }

        addRoute(route) {
            this._routes.push(route);
        }

        removeRoute(value) {
            this._routes = this._routes.filter((route) => {
                return route.value !== value;
            });
        }
    }

    class View {
        constructor() {
            this.init();
        }

        // инициализация

        init() {
            this.routeList = document.getElementById('routesList');
            this.routeInput = document.getElementById('routeInput');

            this.routeInput.addEventListener('keypress', (e) => {
                controller.onPressAdd(e.keyCode, e.target.value);
            });
        }

        // Общий метод рендера

        render(routesArray, geoCollection) {
            this.renderList(routesArray);
            this.renderMap(routesArray, geoCollection);
        }

        // рендерим элементы карты

        renderMap(routesArray, geoCollection) {
            geoCollection.removeAll();

            routesArray.forEach((route) => {
                let placeMark = new ymaps.Placemark(route.coords, {
                    balloonContent: route.value
                }, {
                    draggable: true,
                });
                placeMark.events.add('dragend', (e) => {
                    controller.onDragRedraw(e.get('target').geometry._coordinates, e.get('target').properties._data.balloonContent); // перетаскивание на карте
                });
                geoCollection.add(placeMark);
            });

            if (routesArray.length > 1) {
                view.drawRoute(routesArray, geoCollection);
            }

            myMap.geoObjects.add(geoCollection);
        }

        // рендерим список

        renderList(routesArray) {
            this.routeList.innerHTML = '';
            routesArray.forEach((route) => {
                let li = document.createElement('li');
                let btn = document.createElement('button');
                btn.classList.add('delete');
                btn.addEventListener('click', (e) => {
                    Controller.removeRoute(e.target.parentElement.innerText);
                });
                li.innerHTML = route.value;
                li.append(btn);
                this.routeList.appendChild(li);
            });
            controller.dragListOn(); // перетаскивание списка
        }

        // рисуем маршрут

        drawRoute(routesArray, geoCollection) {
            let coords = [];
            routesArray.forEach((route) => {
                coords.push(route.coords);
            });
            geoCollection.add(new ymaps.Polyline(coords));
        }
    }

    class Controller {
        constructor() {
        }

        // Добавить маршрут из поля Input

        onPressAdd(eKeycode, eValue) {

            if (eKeycode === 13) {
                let value = eValue;
                let myGeoCoder = ymaps.geocode(value);
                myGeoCoder.then(
                    function (res) {
                        model.addRoute({
                            value: value,
                            coords: res.geoObjects.get(0).geometry.getCoordinates()
                        });
                        myMap.setCenter(res.geoObjects.get(0).geometry.getCoordinates());
                        view.render(model.routes, model.geoCollection);
                    },
                    function (err) {
                        console.log('Ошибка');
                    }
                );
                view.routeInput.value = '';
            }
        }

        // Удаление маршрута кнопкой

        static removeRoute(value) {
            model.removeRoute(value);
            view.render(model.routes, model.geoCollection);
        }

        // Перетаскивание списка

        dragListOn() {
            let sortable = Sortable.create(view.routeList, {
                onEnd: function (e) {
                    let temp = model.routes[e.oldIndex];
                    model.routes[e.oldIndex] = model.routes[e.newIndex];
                    model.routes[e.newIndex] = temp;
                    view.render(model.routes, model.geoCollection);
                },
            });
        }

        // Перетаскивание по карте

        onDragRedraw(eCoordinates, eValue) {
            let newCoords = eCoordinates;
            let value = eValue;
            let newValue;
            let myGeoCoder = ymaps.geocode(newCoords);
            myGeoCoder.then(
                function (res) {
                    newValue = res.geoObjects.get(0).getAddressLine();
                    model.routes.forEach((item) => {
                        if (item.value === value) {
                            item.coords = newCoords;
                            item.value = newValue;
                            view.render(model.routes, model.geoCollection);
                        }
                    })
                },
                function (err) {
                    console.log('Ошибка');
                }
            );
        }
    }


    let myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],
        zoom: 4,
        controls: []
    });

    let model = new Model(),
        view = new View(),
        controller = new Controller();


});