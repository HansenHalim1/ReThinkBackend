import SwiftUI
import AVKit

// Add both Swift files to an iOS 16+ target. This public-media demo needs no login.
struct ConceptVideoDemo: View {
    let api: ReThinkAPI
    @State private var topicId = "distribution"
    @State private var videos: [ConceptVideo] = []
    @State private var error: String?
    @State private var loading = false
    @State private var retry = 0

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Picker("Topic", selection: $topicId) {
                        Text("Distributif").tag("distribution")
                        Text("Kuadrat").tag("x-quadratic")
                        Text("Turunan").tag("advanced-derivatives")
                    }.pickerStyle(.segmented)
                    if loading { ProgressView("Loading videos…") }
                    if let error {
                        Text(error).foregroundStyle(.red)
                        Button("Retry") { retry += 1 }
                    }
                    ForEach(videos) { video in PilotPlayer(video: video) }
                    if !loading && error == nil && videos.isEmpty { Text("No video for this topic yet.") }
                }.padding()
            }
            .navigationTitle("ReThink Video")
            .task(id: "\(topicId)-\(retry)") {
                videos = []; loading = true; error = nil
                do {
                    let catalog = try await api.videos(topicId: topicId)
                    try Task.checkCancellation()
                    videos = catalog.videos
                } catch is CancellationError { return }
                catch {
                    guard !Task.isCancelled else { return }
                    self.error = error.localizedDescription
                }
                loading = false
            }
        }
    }
}

private struct PilotPlayer: View {
    let video: ConceptVideo
    @State private var player: AVPlayer?
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(video.title).font(.title2)
            Text(video.summary)
            VideoPlayer(player: player).aspectRatio(16 / 9, contentMode: .fit)
            Text(video.hasAudio ? "Bahasa Indonesia" : "Animasi tanpa suara · transkrip Bahasa Indonesia")
                .font(.caption)
            DisclosureGroup("Transkrip") {
                ForEach(video.transcript, id: \.startSeconds) { cue in
                    Button {
                        player?.seek(to: CMTime(seconds: cue.startSeconds, preferredTimescale: 600))
                    } label: {
                        Text("\(Int(cue.startSeconds))s · \(cue.text)")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }.padding(.vertical, 4)
                }
            }
        }
        .task(id: video.id) { player = AVPlayer(url: video.videoUrl) }
        .onDisappear { player?.pause() }
    }
}
