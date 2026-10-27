import Capacitor

/// The app's web view (Main.storyboard). Registers the plugins that live in
/// this app rather than in node_modules.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
    }
}
