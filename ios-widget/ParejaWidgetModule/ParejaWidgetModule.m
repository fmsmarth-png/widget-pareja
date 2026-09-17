#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ParejaWidgetModule, NSObject)

RCT_EXTERN_METHOD(updateWidgetData:(NSString *)estado
                  mensaje:(NSString *)mensaje
                  personajeId:(NSString *)personajeId
                  carpeta:(NSString *)carpeta
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
