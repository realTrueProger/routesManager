// Старт приложения

ymaps.ready(() => {

    class Model {
        constructor() {
            this.routes = [];
            this.geoCollection = new ymaps.GeoObjectCollection();
        }
    }


    class View {
        constructor() {
            this.init();
        }

        // инициализация

        init() {
            this.routeList = document.getElementById('routesList');
        }

        // Общий метод рендера

        render(routesArray, geoCollection) {
            this.renderList(routesArray);
            this.renderMap(routesArray, geoCollection);
        }

        // рендерим элементы карты

        renderMap(routesArray, geoCollection) {
            geoCollection.removeAll();
            // for (let i = 0; i < routesArray.length; i++) {
            //     let placeMark = new ymaps.Placemark(routesArray[i].coords, {
            //         balloonContent: routesArray[i].value
            //     }, {
            //         draggable: true,
            //     });
            //     placeMark.events.add('dragend', (e) => {
            //         controller.onDragRedraw(e); // перетаскивание на карте
            //     });
            //
            //     geoCollection.add(placeMark);
            // }

            routesArray.forEach((route) => {
                let placeMark = new ymaps.Placemark(route.coords, {
                    balloonContent: route.value
                }, {
                    draggable: true,
                });
                placeMark.events.add('dragend', (e) => {
                    controller.onDragRedraw(e); // перетаскивание на карте
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
            for (let i = 0; i < routesArray.length; i++) {
                let li = document.createElement('li');
                let btn = document.createElement('button');
                btn.classList.add('delete');
                btn.addEventListener('click', controller.removeRoute);
                li.innerHTML = routesArray[i].value;
                li.append(btn);
                this.routeList.appendChild(li);
            }

            controller.dragListOn(); // перетаскивание списка
        }

        // рисуем маршрут

        drawRoute(routesArray, geoCollection) {
            let coords = [];
            for (let i = 0; i < routesArray.length; i++) {
                coords.push(routesArray[i].coords);
            }
            geoCollection.add(new ymaps.Polyline(coords));
        }
    }

    class Controller {
        constructor() {
            this.init();
        }

        // инициализация

        init() {
            document.getElementById('routeInput').addEventListener('keypress', this.onPressAdd);
        }

        // Добавить маршрут из поля Input

        onPressAdd(e) {

            if (e.keyCode === 13) {
                let value = e.target.value;
                let myGeoCoder = ymaps.geocode(value);
                myGeoCoder.then(
                    function (res) {
                        model.routes.push({
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
                e.target.value = '';
            }
        }

        removeRoute(e) {
            model.routes = model.routes.filter((route) => {
                return route.value !== e.target.parentElement.innerText;
            });
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
        zoom: 10,
        controls: []
    });

    let model = new Model(),
        view = new View(),
        controller = new Controller();


});