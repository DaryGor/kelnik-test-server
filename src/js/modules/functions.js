import noUiSlider from "nouislider";

const URL = "http://localhost:3002/products";

// Форматирование картинок в WebP
export function isWebp() {
  function testWebP(callback) {
    let webP = new Image();
    webP.onload = webP.onerror = function () {
      callback(webP.height == 2);
    };
    webP.src =
      "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
  }

  testWebP(function (support) {
    let className = support === true ? "webp" : "no-webp";
    document.documentElement.classList.add(className);
  });
}

// Функция, запускающая приложение
export async function createApp() {
  const data = await getData();

  createCatalogTable(data);

  // Получаем максимальные и минимальные значения для фильтров
  const minmax = minMaxValues(data);
  // Создаем фильтр с ползунками
  createRangeFilter(minmax);

  const rooms = uniqRooms(data);
  createRoomsFilter(rooms);

  // Событие на изменения инпутов в форме
  document.getElementById("form").addEventListener("change", changeForm);

  // Событие на изменения положения ползунков в форме
  const touch = document.querySelectorAll(".noUi-touch-area");
  touch.forEach((item) => item.addEventListener("mousedown", changeForm));

  showMore();
}

//
// Получение списка каталога
async function getData() {
  const response = await fetch(`${URL}?_page=1_limit=20`);
  const data = await response.json();
  return data;
}

// Функция, которая заносит элементы каталога в таблицу
function createCatalogTable(data) {
  const elementList = document.getElementById("table-data");
  elementList.innerHTML = "";

  addCatalogTable(data);
}

// Функция, которая добавляет новые элементы в таблицу
function addCatalogTable(data) {
  const elementList = document.getElementById("table-data");

  data.forEach((item) => {
    // Создаём строку таблицы
    const tableRow = document.createElement("div");
    tableRow.classList.add("table-row");
    tableRow.setAttribute("aria-label", "row");
    elementList.append(tableRow);

    // Создаём колонку с изображением
    const imgContainer = document.createElement("div");
    imgContainer.classList.add("table-row__data", "table-row__data--img");
    tableRow.append(imgContainer);

    // Добавляем изображение
    const img = document.createElement("img");
    img.classList.add("table__img");
    img.setAttribute("src", item.img);
    img.setAttribute(
      "alt",
      `Квартира ${item.rooms}-комнатная №${item.number} на ${item.floor} этаже`
    );
    imgContainer.append(img);

    // Создаём колонку под название кватиры и добавляем его
    const title = document.createElement("div");
    title.classList.add(
      "table-row__data",
      "table__text",
      "table__text--medium",
      "table-row__data--ml",
      "table-row__data--title"
    );
    title.textContent = `${item.rooms}-комнатная №${item.number}`;
    tableRow.append(title);

    // Создаём колонку под площадь кватиры и добавляем её
    const square = document.createElement("div");
    square.classList.add(
      "table-row__data",
      "table__text",
      "table-row__data--square"
    );
    square.innerHTML = `${item.square} <span class="table__span-label">м²</span>`;
    tableRow.append(square);

    // Создаём колонку под этаж квартиры
    const tableRowDataFloor = document.createElement("div");
    tableRowDataFloor.classList.add(
      "table-row__data",
      "table-row__data--floor"
    );
    tableRow.append(tableRowDataFloor);

    // Создаём контейнер под этаж квартиры
    const containerFloor = document.createElement("div");
    containerFloor.classList.add("table__floor");
    tableRowDataFloor.append(containerFloor);

    // Добавляем номер этажа
    const floor = document.createElement("span");
    floor.classList.add("table__text", "table__number");
    floor.textContent = item.floor;
    containerFloor.append(floor);

    // Добавляем количество этажей в доме
    const total = document.createElement("span");
    total.classList.add("table__total", "table__text--light");
    total.innerHTML = `из ${item.totalFloor} <span class="table__span-label">этаж</span>`;
    containerFloor.append(total);

    // Создаём колонку под стоимость кватиры и добавляем её
    const price = document.createElement("div");
    price.classList.add(
      "table-row__data",
      "table__text",
      "table-row__data--price"
    );
    price.innerHTML = `${item.price.toLocaleString(
      "ru-RU"
    )} <span class="table__span-label">₽</span>`;
    tableRow.append(price);
  });
}

// Функция, которая получает максимальные и минимальные значения для фильтрации
function minMaxValues(data) {
  const props = ["square", "price"];
  let max = [],
    min = [];

  props.forEach((prop) => {
    const elem = data.reduce(function (prev, cur) {
      return cur[prop] > prev[prop] ? cur : prev;
    });
    max.push(elem[prop]);
  });

  props.forEach((prop) => {
    const elem = data.reduce(function (prev, cur) {
      return cur[prop] < prev[prop] ? cur : prev;
    });
    min.push(elem[prop]);
  });

  return {
    min,
    max,
  };
}

//Функция, которая получает уникальное количество комнат в квартире
function uniqRooms(data) {
  const rooms = data.map((x) => x.rooms);
  return Array.from(new Set(rooms)).sort();
}

// Функция, которая создает фильтр по количеству комнат в квартире
function createRoomsFilter(rooms) {
  const container = document.getElementById("formRooms");

  rooms.map((room) => {
    const formRoom = document.createElement("div");
    formRoom.classList.add("form__room");
    formRoom.innerHTML = `<input type="checkbox" id="room${room}" aria-label="${room}" class="form__room-input"><label for="room${room}" class="form__room-label">${room}К</label>`;
    container.append(formRoom);
  });
}

// Функция, которая создает контейнер для фильтра с ползунками
function createRangeFilter(minmax) {
  const container = document.getElementById("range");

  const filters = [
    {
      title: "Стомость квартиры, ₽",
      // 10-ки учитывают зазор от крайнего значения
      for: minmax.min[1] - 10,
      to: minmax.max[1] + 10,
      idFor: "priceFor",
      idTo: "priceTo",
      idSlider: "priceSlider",
      key: "price",
    },
    {
      title: "Площадь, м²",
      // 10-ки учитывают зазор от крайнего значения
      for: minmax.min[0] - 10,
      to: minmax.max[0] + 10,
      idFor: "squareFor",
      idTo: "squareTo",
      idSlider: "squareSlider",
      key: "square",
    },
  ];

  // Создание инпутов для управления фильтрами
  filters.forEach((item) => {
    const range = document.createElement("div");
    range.classList.add("range");
    container.append(range);

    const title = document.createElement("span");
    title.classList.add("ranges__title");
    title.textContent = item.title;
    range.append(title);

    const rangesValues = document.createElement("div");
    rangesValues.classList.add("ranges__values");
    range.append(rangesValues);

    const valueBlock1 = document.createElement("div");
    valueBlock1.classList.add("ranges__value-block");
    rangesValues.append(valueBlock1);

    const spanFor = document.createElement("span");
    spanFor.classList.add("ranges__span");
    spanFor.textContent = "от";
    valueBlock1.append(spanFor);

    const inputFor = document.createElement("input");
    inputFor.setAttribute("type", "number");
    inputFor.setAttribute("value", item.for);
    inputFor.setAttribute("id", item.idFor);
    inputFor.classList.add("ranges__input");
    valueBlock1.append(inputFor);

    const valueBlock2 = document.createElement("div");
    valueBlock2.classList.add("ranges__value-block");
    rangesValues.append(valueBlock2);

    const spanTo = document.createElement("span");
    spanTo.classList.add("ranges__span");
    spanTo.textContent = "до";
    valueBlock2.append(spanTo);

    const inputTo = document.createElement("input");
    inputTo.setAttribute("type", "number");
    inputTo.setAttribute("value", item.to);
    inputTo.setAttribute("id", item.idTo);
    inputTo.classList.add("ranges__input");
    valueBlock2.append(inputTo);

    const slider = document.createElement("div");
    inputTo.classList.add("slider");
    slider.setAttribute("id", item.idSlider);
    range.append(slider);
  });

  // Создание ползунков для фильтров
  startRange(filters);
}

// Сортировка ползунками в фильтре
// Плагин https://refreshless.com/nouislider/
function startRange(filters) {
  const form = document.getElementById("form");

  filters.forEach((item) => {
    // Получаем элемент слайдера по id
    const slider = document.getElementById(item.idSlider);

    // Инициализация слайдера с указанными крайними значениями
    if (slider) {
      noUiSlider.create(slider, {
        start: [item.for, item.to],
        connect: true,
        step: 1,
        range: {
          min: item.for,
          max: item.to,
        },
      });
    }

    // Получаем массив с инпутами для слайдера
    let inputs = [
      document.getElementById(item.idFor),
      document.getElementById(item.idTo),
    ];

    // Функция, которая меняет данные в инпутах, в зависимости от положения ползунка
    slider.noUiSlider.on("update", function (values, handle) {
      inputs[handle].value = Math.round(values[handle]);
      mainFilter();
    });

    // Функция, которая меняет положение ползунка в зависимости от данных с инпутов
    const setRangeSlider = (i, value) => {
      let array = [null, null];
      array[i] = value;
      slider.noUiSlider.set(array);
    };

    inputs.forEach((item, index) => {
      item.addEventListener("change", (e) => {
        // При изменениях значений в инпутах передаем в слайдер актуальные положения точек
        setRangeSlider(index, e.currentTarget.value);
      });
    });

    // Сброс ползунков слайдера при ресете формы
    form.addEventListener("reset", function () {
      slider.noUiSlider.set([item.for, item.to]);
      mainFilter();
    });
  });
}

// Функция, которая собирает данные для фильтрации
function getFilterData() {
  const container = document.getElementById("formRooms");
  const rooms = container.querySelectorAll(".form__room-input:checked");

  const minPrice = +document.querySelector("#priceFor").value;
  const maxPrice = +document.querySelector("#priceTo").value;
  const minSquare = +document.querySelector("#squareFor").value;
  const maxSquare = +document.querySelector("#squareTo").value;

  let searchParams = new URLSearchParams({
    _page: 1,
    _limit: 20,
    price_gte: minPrice,
    price_lte: maxPrice,
    square_gte: minSquare,
    square_lte: maxSquare,
  });

  if (rooms.length > 0) {
    let ariaLabels = [];
    rooms.forEach((room) => {
      ariaLabels.push(+room.getAttribute("aria-label"));
    });

    ariaLabels.forEach((item) => {
      searchParams.append("rooms", item);
    });
  }

  return searchParams;
}

// Функция, которая фильтрует элементы по всем параметрам
async function mainFilter() {
  let params = getFilterData();
  let searchParams = new URLSearchParams(params);

  const response = await fetch(`${URL}?${searchParams}`);

  const data = await response.json();
  createCatalogTable(data);
}

// Функция, которая блокирует форму и производит фильтрацию при изменении полей формы
function changeForm() {
  document.getElementById("form").style.pointerEvents = "none";
  document.getElementById("more").style.display = "block";
  mainFilter();
  setTimeout(() => {
    document.getElementById("form").style.pointerEvents = "auto";
  }, 1000);
}

// Поведение кнопки "Показать ещё"
async function showMore() {
  // Получаем текущие параметры фильтра
  let params = getFilterData();
  let searchParams = new URLSearchParams(params);

  const response = await fetch(URL);
  const data = await response.json(),
    limit = 20;
  let page = 2;
  const dataValue = data.length,
    btn = document.getElementById("more");

  btn.addEventListener("click", async function () {
    searchParams.set("_page", page++);
    let dataShow = page * limit;

    const response = await fetch(`${URL}?${searchParams}`);
    const data = await response.json();

    addCatalogTable(data);

    if (dataShow > dataValue) {
      btn.style.display = "none";
    }
  });
}
