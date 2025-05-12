const synth = window.speechSynthesis
let isSpeaking = false
let isLoading = false
let activeMarker = null
let isProcessingMarker = false // Flag para evitar procesamiento simultáneo de marcadores
let persistentMode = false // Flag para modo persistente
let lastScannedModelId = null // Para guardar el ID del último modelo escaneado

const playBtn = document.getElementById("play-btn")
const stopBtn = document.getElementById("stop-btn")
const scanNewBtn = document.getElementById("scan-new-btn")
const playText = document.getElementById("play-text")
const loadingText = document.getElementById("loading-text")
const textElement = document.getElementById("valor-text")
const titleElement = document.getElementById("title")
const instructionMessage = document.getElementById("instruction-message")

// Posición original de los modelos
const originalModelPosition = "0 -1.5 0"

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

// Función para actualizar el estado de los botones
function updateButtonState() {
  // Ocultar todos los botones primero
  playBtn.classList.add("hidden")
  stopBtn.classList.add("hidden")
  scanNewBtn.classList.add("hidden")

  // Solo mostrar botones si hay un marcador activo
  if (activeMarker) {
    if (isSpeaking) {
      // Si está reproduciendo, mostrar el botón de detener
      stopBtn.classList.remove("hidden")
    } else {
      // Si no está reproduciendo, mostrar el botón de reproducir
      playBtn.classList.remove("hidden")

      // Asegurarse de que el botón muestre "Reproducir" y no "Cargando"
      if (!isLoading) {
        playText.classList.remove("hidden")
        loadingText.classList.add("hidden")
      }
    }

    // Mostrar el botón de escanear nuevo si estamos en modo persistente
    if (persistentMode) {
      scanNewBtn.classList.remove("hidden")
    }
  }
}

// Función para mostrar el estado de carga
function showLoadingState() {
  isLoading = true
  playText.classList.add("hidden")
  loadingText.classList.remove("hidden")
  playBtn.disabled = true
}

// Función para ocultar el estado de carga
function hideLoadingState() {
  isLoading = false
  playText.classList.remove("hidden")
  loadingText.classList.add("hidden")
  playBtn.disabled = false
}

// Función para detener la reproducción
function stopSpeaking() {
  synth.cancel()
  isSpeaking = false
  hideLoadingState()
  updateButtonState()
}

// Función para hacer que un modelo permanezca visible incluso cuando el marcador se pierde
function makeModelPersistent(markerId) {
  const markerKey = markerId.replace("marker-", "")
  const marker = document.querySelector(`#${markerId}`)

  // Guardar el ID del último modelo escaneado
  lastScannedModelId = markerKey

  // Activar el modo persistente
  persistentMode = true

  // Configurar el marcador para que no oculte el modelo cuando se pierde
  if (marker) {
    // Obtener la entidad del modelo
    const modelEntity = marker.querySelector(`#${markerKey}-model`)

    if (modelEntity) {
      // Asegurarse de que el modelo sea visible
      modelEntity.setAttribute("visible", "true")

      // Asegurarse de que el modelo esté en la posición correcta
      modelEntity.setAttribute("position", originalModelPosition)

      // Aplicar filtro de suavizado para reducir la vibración
      modelEntity.setAttribute("animation__filter", {
        property: "position",
        dur: 100,
        easing: "linear",
        loop: false,
      })

      // Eliminar cualquier clase que pueda estar ocultando el modelo
      modelEntity.classList.remove("hidden-model")

      // Configurar el marcador para que no oculte el modelo cuando se pierde
      marker.setAttribute("emitevents", "true")

      // Actualizar los botones
      updateButtonState()

      console.log(`Modelo ${markerKey} hecho persistente y visible en posición ${originalModelPosition}`)
    }
  }
}

// Función para mostrar el contenido del marcador
function showMarkerContent(markerId) {
  // Si ya hay un marcador activo o estamos procesando otro, ignorar este
  if (isProcessingMarker && activeMarker && activeMarker !== markerId) {
    return
  }

  isProcessingMarker = true

  // Si hay una reproducción en curso, detenerla
  if (isSpeaking) {
    stopSpeaking()
  }

  const markerKey = markerId.replace("marker-", "")

  // Si estamos cambiando de marcador, ocultar el modelo anterior
  if (activeMarker && activeMarker !== markerId && lastScannedModelId) {
    const previousModelId = activeMarker.replace("marker-", "")
    const previousModel = document.querySelector(`#${previousModelId}-model`)
    if (previousModel) {
      previousModel.setAttribute("visible", "false")
    }
  }

  // Ocultar mensaje de instrucción
  instructionMessage.classList.add("hidden")

  // Mostrar título y texto
  titleElement.classList.remove("hidden")
  textElement.classList.remove("hidden")

  // Establecer contenido
  titleElement.innerText = texts[markerKey].title
  textElement.innerText = texts[markerKey].content

  // Actualizar marcador activo
  activeMarker = markerId

  // Hacer que el modelo permanezca visible
  makeModelPersistent(markerId)

  // Liberar el flag después de un breve retraso para evitar cambios rápidos
  setTimeout(() => {
    isProcessingMarker = false
  }, 500)
}

// Función para ocultar el contenido cuando se pierde un marcador
function hideMarkerContent(markerId) {
  // Si estamos en modo persistente, no ocultamos el contenido
  if (persistentMode) return

  if (activeMarker === markerId) {
    // Ocultar título y texto
    titleElement.classList.add("hidden")
    textElement.classList.add("hidden")
    // Mostrar mensaje de instrucción
    instructionMessage.classList.remove("hidden")
    // Resetear marcador activo
    activeMarker = null
    // Ocultar botones y detener reproducción
    playBtn.classList.add("hidden")
    stopBtn.classList.add("hidden")
    scanNewBtn.classList.add("hidden")
    stopSpeaking()
  }
}

// Función para ocultar todos los modelos 3D
function hideAllModels() {
  const modelIds = ["honestidad", "respeto", "justicia", "compromiso", "diligencia", "veracidad"]

  modelIds.forEach((id) => {
    // Obtener el modelo
    const model = document.querySelector(`#${id}-model`)
    if (model) {
      // Ocultar el modelo
      model.setAttribute("visible", "false")

      // Añadir clase para ocultar
      model.classList.add("hidden-model")

      console.log(`Modelo ${id} ocultado`)
    }
  })
}

// Función para preparar todos los modelos para ser detectados nuevamente
function resetModelsForDetection() {
  const modelIds = ["honestidad", "respeto", "justicia", "compromiso", "diligencia", "veracidad"]

  modelIds.forEach((id) => {
    // Obtener el modelo
    const model = document.querySelector(`#${id}-model`)
    if (model) {
      // Restaurar la posición original
      model.setAttribute("position", originalModelPosition)

      // Eliminar clase que oculta
      model.classList.remove("hidden-model")

      // El modelo sigue invisible hasta que se detecte el marcador
      model.setAttribute("visible", "false")

      console.log(`Modelo ${id} preparado para detección`)
    }
  })
}

// Función para resetear al modo de escaneo
function resetToScanMode() {
  // Ocultar todos los modelos 3D
  hideAllModels()

  // Preparar modelos para ser detectados nuevamente
  resetModelsForDetection()

  // Resetear el modo persistente
  persistentMode = false
  lastScannedModelId = null

  // Ocultar título y texto
  titleElement.classList.add("hidden")
  textElement.classList.add("hidden")

  // Mostrar mensaje de instrucción
  instructionMessage.classList.remove("hidden")

  // Resetear marcador activo
  activeMarker = null

  // Detener cualquier reproducción
  stopSpeaking()

  // Actualizar botones
  updateButtonState()

  // Registrar en consola para depuración
  console.log("Modo de escaneo restablecido. Todos los modelos ocultos y preparados para detección.")
}

// Detectar cuándo un marcador es visible
document.querySelector("#marker-honestidad").addEventListener("markerFound", () => {
  showMarkerContent("marker-honestidad")
})
document.querySelector("#marker-respeto").addEventListener("markerFound", () => {
  showMarkerContent("marker-respeto")
})
document.querySelector("#marker-justicia").addEventListener("markerFound", () => {
  showMarkerContent("marker-justicia")
})
document.querySelector("#marker-compromiso").addEventListener("markerFound", () => {
  showMarkerContent("marker-compromiso")
})
document.querySelector("#marker-diligencia").addEventListener("markerFound", () => {
  showMarkerContent("marker-diligencia")
})
document.querySelector("#marker-veracidad").addEventListener("markerFound", () => {
  showMarkerContent("marker-veracidad")
})

// Detectar cuándo un marcador se pierde
document.querySelector("#marker-honestidad").addEventListener("markerLost", () => {
  hideMarkerContent("marker-honestidad")
})
document.querySelector("#marker-respeto").addEventListener("markerLost", () => {
  hideMarkerContent("marker-respeto")
})
document.querySelector("#marker-justicia").addEventListener("markerLost", () => {
  hideMarkerContent("marker-justicia")
})
document.querySelector("#marker-compromiso").addEventListener("markerLost", () => {
  hideMarkerContent("marker-compromiso")
})
document.querySelector("#marker-diligencia").addEventListener("markerLost", () => {
  hideMarkerContent("marker-diligencia")
})
document.querySelector("#marker-veracidad").addEventListener("markerLost", () => {
  hideMarkerContent("marker-veracidad")
})

// Función para iniciar la reproducción
playBtn.addEventListener("click", () => {
  if (textElement.innerText && !isLoading) {
    // Mostrar estado de carga
    showLoadingState()

    const utterance = new SpeechSynthesisUtterance(textElement.innerText)
    utterance.lang = "es-ES"
    utterance.rate = 1.0
    utterance.pitch = 1.0

    const loadingTimeout = setTimeout(() => {
      hideLoadingState()
    }, 5000) // Máximo 5 segundos esperando que empiece a hablar

    utterance.onstart = () => {
      // Cancelar el timeout ya que la reproducción ha comenzado
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

// Función para detener la reproducción
stopBtn.addEventListener("click", () => {
  stopSpeaking()
})

// Función para escanear un nuevo marcador
scanNewBtn.addEventListener("click", () => {
  resetToScanMode()
})

// prevenir zoom en dispositivos iOS
document.addEventListener("gesturestart", (e) => {
  e.preventDefault()
})

// Precarga de voces para mejorar el tiempo de respuesta
window.addEventListener("DOMContentLoaded", () => {
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices()
    }
  }

  // Asegurarse de que todos los modelos estén preparados para detección al cargar
  resetModelsForDetection()
})

// Detección de dispositivo móvil y mostrar advertencia en pantallas grandes
function isMobileDevice() {
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
}

function checkDeviceAndShowWarning() {
  const desktopWarning = document.getElementById("desktop-warning")
  const container = document.getElementById("container")

  if (!isMobileDevice()) {
    desktopWarning.style.display = "flex"
    // Ocultar completamente el contenedor principal para que no se vea la cámara
    container.style.display = "none"
  } else {
    desktopWarning.style.display = "none"
    container.style.display = "flex"
  }
}

// Verificar al cargar la página y cuando cambie el tamaño de la ventana
window.addEventListener("load", checkDeviceAndShowWarning)
window.addEventListener("resize", checkDeviceAndShowWarning)

// Configurar botones de la advertencia
document.getElementById("back-btn").addEventListener("click", () => {
  window.history.back()
})

