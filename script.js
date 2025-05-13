// Variables globales optimizadas
const synth = window.speechSynthesis
let isSpeaking = false
let isLoading = false
let activeMarker = null
let isProcessingMarker = false
let persistentMode = false
let lastScannedModelId = null
const animatedModels = {}

// Referencias DOM
const playBtn = document.getElementById("play-btn")
const stopBtn = document.getElementById("stop-btn")
const scanNewBtn = document.getElementById("scan-new-btn")
const playText = document.getElementById("play-text")
const loadingText = document.getElementById("loading-text")
const textElement = document.getElementById("valor-text")
const titleElement = document.getElementById("title")
const instructionMessage = document.getElementById("instruction-message")
const desktopWarning = document.getElementById("desktop-warning")
const landscapeWarning = document.getElementById("landscape-warning")
const container = document.getElementById("container")

// Posición original de los modelos
const originalModelPosition = "0 -1.5 0"

// Datos de contenido
const texts = {
  honestidad: {
    title: "Valor Intitucional: HONESTIDAD",
    content:
      "Actuar con transparencia, rectitud y coherencia entre lo que se piensa, se dice y se hace, fomentando la confianza y el respeto mutuo. La honestidad en la Universidad Popular del Cesar guía el comportamiento ético de todos sus miembros, promoviendo relaciones basadas en la verdad y la integridad, fundamentales para el desarrollo académico y humano.",
  },
  respeto: {
    title: "Valor Intitucional: RESPETO",
    content:
      "Reconocer y valorar la dignidad, ideas, creencias y diferencias de los demás, manteniendo una convivencia armónica. En la Universidad Popular del Cesar, el respeto es un pilar esencial para construir una comunidad incluyente, tolerante y democrática, donde el diálogo y la aceptación de la diversidad enriquecen el proceso formativo.",
  },
  justicia: {
    title: "Valor Intitucional: JUSTICIA",
    content:
      "Garantizar la equidad, la imparcialidad y el cumplimiento de los derechos y deberes de todos los miembros de la comunidad universitaria. La Universidad Popular del Cesar se compromete con una educación justa, donde se brinda igualdad de oportunidades y se vela por el bienestar común, contribuyendo a una sociedad más equilibrada y solidaria.",
  },
  compromiso: {
    title: "Valor Intitucional: COMPROMISO",
    content:
      "Asumir con responsabilidad y entrega las tareas y metas institucionales, aportando al cumplimiento de la misión y visión universitaria. El compromiso en la Universidad Popular del Cesar refleja la disposición de sus miembros para contribuir activamente con el desarrollo personal, profesional y social desde su rol en la comunidad educativa.",
  },
  diligencia: {
    title: "Valor Intitucional: DILIGENCIA",
    content:
      "Cumplir con esmero, responsabilidad y eficiencia las funciones y tareas asignadas, procurando siempre la excelencia. En la Universidad Popular del Cesar, la diligencia impulsa una cultura del trabajo bien hecho, del esfuerzo constante y del compromiso con la mejora continua en los procesos académicos y administrativos.",
  },
  veracidad: {
    title: "Valor Intitucional: VERACIDAD",
    content:
      "Expresar siempre la verdad con responsabilidad y sin distorsiones, en la búsqueda del conocimiento y en las relaciones interpersonales. La veracidad en la Universidad Popular del Cesar es base para la confianza institucional, la credibilidad académica y el ejercicio crítico y reflexivo de la libertad de pensamiento.",
  },
}

// Lista de IDs de modelos para reutilizar
const modelIds = ["honestidad", "respeto", "justicia", "compromiso", "diligencia", "veracidad"]

// Función para animar la caída del modelo desde arriba (optimizada)
function animateModelFall(modelEntity) {
  if (!modelEntity) return

  const currentPosition = modelEntity.getAttribute("position")
  const startY = 5
  const endY = currentPosition.y
  const duration = 1000
  const startTime = Date.now()

  modelEntity.setAttribute("position", `${currentPosition.x} ${startY} ${currentPosition.z}`)

  function animate() {
    const elapsedTime = Date.now() - startTime
    const progress = Math.min(elapsedTime / duration, 1)
    const easeOutQuad = (t) => t * (2 - t)
    const currentY = startY - (startY - endY) * easeOutQuad(progress)

    modelEntity.setAttribute("position", `${currentPosition.x} ${currentY} ${currentPosition.z}`)

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  animate()
}

// Funciones de UI optimizadas
function updateButtonState() {
  // Ocultar todos los botones primero
  playBtn.classList.add("hidden")
  stopBtn.classList.add("hidden")
  scanNewBtn.classList.add("hidden")

  // Solo mostrar botones si hay un marcador activo
  if (activeMarker) {
    if (isSpeaking) {
      stopBtn.classList.remove("hidden")
    } else {
      playBtn.classList.remove("hidden")
      if (!isLoading) {
        playText.classList.remove("hidden")
        loadingText.classList.add("hidden")
      }
    }

    if (persistentMode) {
      scanNewBtn.classList.remove("hidden")
    }
  }
}

function showLoadingState() {
  isLoading = true
  playText.classList.add("hidden")
  loadingText.classList.remove("hidden")
  playBtn.disabled = true
}

function hideLoadingState() {
  isLoading = false
  playText.classList.remove("hidden")
  loadingText.classList.add("hidden")
  playBtn.disabled = false
}

function stopSpeaking() {
  synth.cancel()
  isSpeaking = false
  hideLoadingState()
  updateButtonState()
}

// Función para hacer que un modelo permanezca visible
function makeModelPersistent(markerId) {
  const markerKey = markerId.replace("marker-", "")
  const marker = document.querySelector(`#${markerId}`)

  lastScannedModelId = markerKey
  persistentMode = true

  if (marker) {
    const modelEntity = marker.querySelector(`#${markerKey}-model`)
    if (modelEntity) {
      modelEntity.setAttribute("visible", "true")

      if (!animatedModels[markerKey]) {
        animatedModels[markerKey] = true
        animateModelFall(modelEntity)
      }

      modelEntity.setAttribute("animation__filter", {
        property: "position",
        dur: 100,
        easing: "linear",
        loop: false,
      })

      modelEntity.classList.remove("hidden-model")
      marker.setAttribute("emitevents", "true")
      updateButtonState()
    }
  }
}

// Función para restablecer solo la posición del modelo
function resetModelPosition(markerId) {
  const markerKey = markerId.replace("marker-", "")
  const marker = document.querySelector(`#${markerId}`)

  if (marker) {
    const modelEntity = marker.querySelector(`#${markerKey}-model`)
    if (modelEntity) {
      modelEntity.setAttribute("position", originalModelPosition)
    }
  }
}

// Función para mostrar el contenido del marcador (optimizada)
function showMarkerContent(markerId) {
  if (isProcessingMarker && activeMarker && activeMarker !== markerId) {
    return
  }

  isProcessingMarker = true

  if (isSpeaking && activeMarker && activeMarker !== markerId) {
    stopSpeaking()
  }

  const markerKey = markerId.replace("marker-", "")

  // Ocultar modelo anterior si existe
  if (activeMarker && activeMarker !== markerId && lastScannedModelId) {
    const previousModelId = activeMarker.replace("marker-", "")
    const previousModel = document.querySelector(`#${previousModelId}-model`)
    if (previousModel) {
      previousModel.setAttribute("visible", "false")
    }
  }

  // Actualizar UI
  instructionMessage.classList.add("hidden")
  titleElement.classList.remove("hidden")
  textElement.classList.remove("hidden")
  titleElement.innerText = texts[markerKey].title
  textElement.innerText = texts[markerKey].content

  activeMarker = markerId

  // Solo restablecer la posición, mantener la escala original
  resetModelPosition(markerId)
  makeModelPersistent(markerId)

  setTimeout(() => {
    isProcessingMarker = false
  }, 500)
}

// Función para ocultar el contenido cuando se pierde un marcador
function hideMarkerContent(markerId) {
  if (persistentMode) return

  if (activeMarker === markerId) {
    titleElement.classList.add("hidden")
    textElement.classList.add("hidden")
    instructionMessage.classList.remove("hidden")
    activeMarker = null
    updateButtonState()
  }
}

// Funciones para gestionar modelos
function hideAllModels() {
  modelIds.forEach((id) => {
    const model = document.querySelector(`#${id}-model`)
    if (model) {
      model.setAttribute("visible", "false")
      model.classList.add("hidden-model")
    }
  })
}

function resetModelsForDetection() {
  modelIds.forEach((id) => {
    const model = document.querySelector(`#${id}-model`)
    if (model) {
      model.setAttribute("position", originalModelPosition)
      model.classList.remove("hidden-model")
      model.setAttribute("visible", "false")
      animatedModels[id] = false
    }
  })
}

// Función para resetear al modo de escaneo
function resetToScanMode() {
  hideAllModels()
  resetModelsForDetection()

  persistentMode = false
  lastScannedModelId = null

  titleElement.classList.add("hidden")
  textElement.classList.add("hidden")
  instructionMessage.classList.remove("hidden")

  activeMarker = null
  stopSpeaking()
  updateButtonState()
}

// Configurar eventos para todos los marcadores
modelIds.forEach((id) => {
  const marker = document.querySelector(`#marker-${id}`)
  if (marker) {
    marker.addEventListener("markerFound", () => showMarkerContent(`marker-${id}`))
    marker.addEventListener("markerLost", () => hideMarkerContent(`marker-${id}`))
  }
})

// Eventos de botones
playBtn.addEventListener("click", () => {
  if (textElement.innerText && !isLoading) {
    showLoadingState()

    const utterance = new SpeechSynthesisUtterance(textElement.innerText)
    utterance.lang = "es-ES"
    utterance.rate = 1.0
    utterance.pitch = 1.0

    const loadingTimeout = setTimeout(hideLoadingState, 5000)

    utterance.onstart = () => {
      clearTimeout(loadingTimeout)
      isSpeaking = true
      hideLoadingState()
      updateButtonState()
    }

    utterance.onend = () => {
      isSpeaking = false
      updateButtonState()
    }

    synth.speak(utterance)
  }
})

stopBtn.addEventListener("click", stopSpeaking)
scanNewBtn.addEventListener("click", resetToScanMode)

// Prevenir zoom en dispositivos iOS
document.addEventListener("gesturestart", (e) => e.preventDefault())

// Detección de dispositivo y orientación
function isMobileDevice() {
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
}

function isPortraitOrientation() {
  return window.innerHeight > window.innerWidth
}

function checkDeviceAndOrientation() {
  // Verificar si es un dispositivo móvil
  const isMobile = isMobileDevice()

  // Verificar si está en orientación vertical (portrait)
  const isPortrait = isPortraitOrientation()

  // Mostrar advertencia de escritorio si no es un dispositivo móvil
  if (!isMobile) {
    desktopWarning.style.display = "flex"
    landscapeWarning.style.display = "none"
    container.style.display = "none"
    return
  }

  // Mostrar advertencia de orientación si está en horizontal (landscape)
  if (!isPortrait) {
    desktopWarning.style.display = "none"
    landscapeWarning.style.display = "flex"
    container.style.display = "none"
    return
  }

  // Si es móvil y está en vertical, mostrar la aplicación
  desktopWarning.style.display = "none"
  landscapeWarning.style.display = "none"
  container.style.display = "flex"
}

// Inicialización
window.addEventListener("DOMContentLoaded", () => {
  // Precarga de voces
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices()
  }

  // Preparar modelos para detección
  resetModelsForDetection()
})

// Verificar dispositivo y orientación al cargar y cuando cambie el tamaño/orientación
window.addEventListener("load", checkDeviceAndOrientation)
window.addEventListener("resize", checkDeviceAndOrientation)
window.addEventListener("orientationchange", checkDeviceAndOrientation)

// Configurar botón de regreso
document.getElementById("back-btn").addEventListener("click", () => window.history.back())

