// Старт приложения

ymaps.ready(() => {

    class Route {
        constructor(value, coords) {
            this.value = value;
            this.coords = coords;
        }
    }

    class Model {
        constructor() {
            this.routes = [];
            this.geoCollection = new ymaps.GeoObjectCollection();
        }

        // новая точка маршрута

        addRoute(value, coords) {
            this.routes.push(new Route(value, coords));
            myMap.setCenter(coords);
            view.render();
        }

        // Удаление точки из списка

        removeRoute(e) {
            model.routes = model.routes.filter((route) => {
                return route.value !== e.target.parentElement.innerText;
            });
            view.render();
        }
    }


    class View {
        constructor() {
            this.routeList = document.getElementById('routesList');
        }

        // рендерим всё

        render() {
            this.renderList();
            this.renderMap();
        }

        // рендерим элементы карты

        renderMap() {
            model.geoCollection.removeAll();
            for (let i = 0; i < model.routes.length; i++) {
                let placeMark = new ymaps.Placemark(model.routes[i].coords, {
                    balloonContent: model.routes[i].value
                }, {
                    draggable: true,
                });
                placeMark.events.add('dragend', (e) => {
                    controller.onDragRedraw(e); // перетаскивание на карте
                });

                model.geoCollection.add(placeMark);
            }

            if (model.routes.length > 1) {
                view.drawRoute();
            }

            myMap.geoObjects.add(model.geoCollection);
        }

        // рендерим список

        renderList() {
            this.routeList.innerHTML = '';
            for (let i = 0; i < model.routes.length; i++) {
                let li = document.createElement('li');
                let btn = document.createElement('button');
                btn.classList.add('delete');
                btn.addEventListener('click', model.removeRoute);
                li.innerHTML = model.routes[i].value;
                li.append(btn);
                this.routeList.appendChild(li);
            }

            controller.dragListOn(); // перетаскивание списка
        }

        // рисуем маршрут

        drawRoute() {
            let coords = [];
            for (let i = 0; i < model.routes.length; i++) {
                coords.push(model.routes[i].coords);
            }
            model.geoCollection.add(new ymaps.Polyline(coords));
        }
    }

    class Controller {
        constructor() {
            document.getElementById('routeInput').addEventListener('keypress', this.getCoords);
        }

        // Получаем значение и координаты новой точки при нажатии Enter

        getCoords(e) {

            if (e.keyCode === 13) {
                let value = e.target.value;
                let myGeoCoder = ymaps.geocode(value);
                myGeoCoder.then(
                    function (res) {
                        model.addRoute(value, res.geoObjects.get(0).geometry.getCoordinates());
                    },
                    function (err) {
                        console.log('Ошибка');
                    }
                );
                e.target.value = '';
            }
        }

        // Перетаскивание списка

        dragListOn() {
            let sortable = Sortable.create(view.routeList, {
                onEnd: function (e) {
                    let temp = model.routes[e.oldIndex];
                    model.routes[e.oldIndex] = model.routes[e.newIndex];
                    model.routes[e.newIndex] = temp;
                    view.render();
                },
            });
        }

        // Перетаскивание по карте

        onDragRedraw(e) {
            let newCoords = e.get('target').geometry._coordinates;
            let value = e.get('target').properties._data.balloonContent;
            let newValue;
            let myGeoCoder = ymaps.geocode(newCoords);
            myGeoCoder.then(
                function (res) {
                    newValue = res.geoObjects.get(0).getAddressLine();
                    model.routes.forEach((item) => {
                        if (item.value === value) {
                            item.coords = newCoords;
                            item.value = newValue;
                            view.render();
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
        zoom: 10,
        controls: []
    });

    let model = new Model(),
        view = new View(),
        controller = new Controller();

});