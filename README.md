# Notepad

Aplicación web desplegable en Azure con una interfaz de bloc de notas de pantalla completa. El usuario escribe en el mismo notepad y envía el contenido a un GPT hospedado en Azure AI Foundry con `Ctrl+Enter` en Windows/Linux o `Command+Enter` en macOS.

La respuesta no se muestra en streaming: el servidor espera a que Azure OpenAI termine y el navegador agrega el texto completo debajo del contenido existente, sin estilos ni diferenciación visual entre prompt y respuesta.

## Ejecución local

```bash
npm install
npm start
```

Abre `http://localhost:8080`. La página del navegador se llama `Notepad`.

## Variables de entorno de la aplicación

Configura estas variables en Azure App Service, en tu entorno local o en el servicio donde ejecutes la app:

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `AZURE_OPENAI_ENDPOINT` | Sí | Endpoint del recurso de Azure OpenAI / Azure AI Foundry, por ejemplo `https://mi-recurso.openai.azure.com/`. |
| `AZURE_OPENAI_API_KEY` | Sí | Clave de acceso del recurso. En producción guárdala como secreto de App Service o Key Vault reference. |
| `AZURE_OPENAI_DEPLOYMENT` | Sí | Nombre del deployment del modelo GPT en Azure AI Foundry, no el nombre base del modelo. |
| `AZURE_OPENAI_API_VERSION` | No | Versión de API. Si no se define, se usa `2024-10-21`. |
| `AZURE_OPENAI_TEMPERATURE` | No | Temperatura de generación. Si no se define, se usa `0.7`. |
| `SYSTEM_PROMPT` | No | Instrucciones del sistema para el asistente. |
| `PORT` | No | Puerto local. Azure App Service lo define automáticamente. |

## Variables y secretos del pipeline

El workflow `.github/workflows/azure-webapp.yml` despliega en Azure App Service al hacer push a `main` o manualmente desde GitHub Actions.

Configura en GitHub:

| Nombre | Tipo | Descripción |
| --- | --- | --- |
| `AZURE_WEBAPP_NAME` | Repository variable | Nombre de la Azure Web App Linux/Node donde se desplegará la aplicación. |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Repository secret | Publish profile descargado desde Azure Portal para esa Web App. |

Las variables de Azure OpenAI no se guardan en GitHub Actions por defecto; deben configurarse como Application settings de la Web App para que la aplicación las lea en tiempo de ejecución.

## Despliegue recomendado en Azure

1. Crea un Azure App Service Linux con runtime Node.js 20 LTS.
2. Crea o reutiliza un recurso de Azure AI Foundry / Azure OpenAI y despliega un modelo GPT.
3. En la Web App, agrega `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY` y `AZURE_OPENAI_DEPLOYMENT` en **Settings > Environment variables**.
4. Descarga el publish profile de la Web App y guárdalo en GitHub como secreto `AZURE_WEBAPP_PUBLISH_PROFILE`.
5. Guarda el nombre de la Web App como variable de repositorio `AZURE_WEBAPP_NAME`.
6. Ejecuta el workflow o haz push a `main`.

## Solución de problemas

Si al usar `Ctrl+Enter` aparece un error en el notepad, revisa primero que las tres variables obligatorias estén configuradas en App Service y que `AZURE_OPENAI_DEPLOYMENT` sea el nombre exacto del deployment del modelo. La aplicación muestra los errores de configuración y los errores devueltos por Azure OpenAI sin exponer la clave, para que no tengas que revisar logs solo para saber qué variable o deployment está mal.
