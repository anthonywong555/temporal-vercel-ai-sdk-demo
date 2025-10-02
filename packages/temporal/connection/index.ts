import { Connection, Client } from '@temporalio/client';
import { 
  getEnv, 
  DEFAULT_TEMPORAL_NAMESPACE,
  LOCAL_HOST_TEMPORAL_ADDRESS,
  ENV_KEY_TEMPORAL_ADDRESS,
  ENV_KEY_TEMPORAL_CLIENT_API_KEY,
  ENV_KEY_TEMPORAL_CLIENT_CERT_PATH,
  ENV_KEY_TEMPORAL_CLIENT_KEY_PATH,
  ENV_KEY_TEMPORAL_NAMESPACE,
  ENV_KEY_TEMPORAL_SERVER_NAME_OVERRIDE,
  ENV_KEY_TEMPORAL_SERVER_ROOT_CA_CERT_PATH,
} from '@boilerplate/common';
import { OpenTelemetryWorkflowClientInterceptor } from '@temporalio/interceptors-opentelemetry';
import { getDataConverter } from '../encryption';
import fs from 'fs/promises';

export async function getConnectionOptions(env: Record<string, string | undefined>) {
  const address = getEnv(env, ENV_KEY_TEMPORAL_ADDRESS, LOCAL_HOST_TEMPORAL_ADDRESS);
  const apiKey = getEnv(env, ENV_KEY_TEMPORAL_CLIENT_API_KEY, '');
  const namespace = getEnv(env, ENV_KEY_TEMPORAL_NAMESPACE, DEFAULT_TEMPORAL_NAMESPACE);
  
  const serverNameOverride = getEnv(env, ENV_KEY_TEMPORAL_SERVER_NAME_OVERRIDE, '');
  const serverRootCACertificate = await maybeReadFileAsBuffer(
    getEnv(env, ENV_KEY_TEMPORAL_SERVER_ROOT_CA_CERT_PATH, '')
  );
  const clientCert = await maybeReadFileAsBuffer(
    getEnv(env, ENV_KEY_TEMPORAL_CLIENT_CERT_PATH, '')
  );
  const clientKey = await maybeReadFileAsBuffer(
    getEnv(env, ENV_KEY_TEMPORAL_CLIENT_KEY_PATH, '')
  );

  return {
    address,
    ...((serverNameOverride && serverRootCACertificate) || (clientKey && clientCert) && {
      tls: {
        serverNameOverride,
        serverRootCACertificate,
        ...(clientKey && clientCert && {
          clientCertPair: {
            crt: clientCert,
            key: clientKey
          }
        }),
      }
    }),
    ...(apiKey && {apiKey}),
    metadata: {
      'temporal-namespace': namespace
    }
  }
}

export function getDeadline(durationInMs?: number) {
  const paddingDuration = durationInMs ? durationInMs : 3000;
  return Date.now() + paddingDuration;
}


export async function connectToTemporal(env: Record<string, string | undefined>, encryption = false, tracer?: any) {
  return new Client({
    connection: await Connection.connect(await getConnectionOptions(env)).catch((err) => {
      console.error('Error connecting to Temporal Server: ', err)
      return undefined
    }),
    interceptors: {
      workflow: [new OpenTelemetryWorkflowClientInterceptor({
        tracer: tracer
      })],
    },
    namespace: getEnv(env, ENV_KEY_TEMPORAL_NAMESPACE, DEFAULT_TEMPORAL_NAMESPACE),
    ...(encryption && {dataConverter: await getDataConverter()})
  });
}

export async function maybeReadFileAsBuffer(path?: string): Promise<Buffer | undefined> {
  if (path === undefined || path === '') return undefined;
  return await fs.readFile(path);
}