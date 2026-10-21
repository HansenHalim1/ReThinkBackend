import SwiftUI
import WebKit

struct ConceptVisualizationDemo: View {
    let backendURL: URL
    let topicId: String
    @State private var visual: ConceptVisualization?
    @State private var selected = 0
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if let visual {
                    Text(visual.title).font(.title2.bold())
                    Text(visual.question)
                    Picker("Langkah contoh", selection: $selected) {
                        ForEach(visual.stages.indices, id: \.self) { index in
                            Text("\(index + 1)").tag(index)
                        }
                    }.pickerStyle(.segmented)
                    let stage = visual.stages[selected]
                    ReadOnlySVGStage(url: stage.svgUrl)
                        .frame(height: 210)
                        .accessibilityLabel(stage.result)
                    Text(stage.result).font(.headline)
                    Text(stage.caption)
                    Text(visual.takeaway).font(.callout)
                } else if let error {
                    Text(error).foregroundStyle(.red)
                } else {
                    ProgressView("Memuat visualisasi…")
                }
            }.padding()
        }
        .task(id: topicId) {
            visual = nil; error = nil; selected = 0
            do {
                let catalog = try await ReThinkAPI(baseURL: backendURL).visualizations(topicId: topicId)
                guard let found = catalog.visualizations.first else {
                    error = "Visualisasi belum tersedia."; return
                }
                visual = found
            } catch { self.error = error.localizedDescription }
        }
    }
}

// Bundled/public authored SVG assets only. No arbitrary student HTML or JavaScript.
private struct ReadOnlySVGStage: UIViewRepresentable {
    let url: URL
    final class Coordinator { var loadedURL: URL? }
    func makeCoordinator() -> Coordinator { Coordinator() }
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = false
        let view = WKWebView(frame: .zero, configuration: config)
        view.scrollView.isScrollEnabled = false
        view.isOpaque = false
        view.backgroundColor = .clear
        return view
    }
    func updateUIView(_ view: WKWebView, context: Context) {
        guard context.coordinator.loadedURL != url else { return }
        context.coordinator.loadedURL = url
        view.load(URLRequest(url: url))
    }
}
