namespace :group do
  desc "Create a new group and add all users, prompt questions and posts"
  task setup: :environment do
    puts "Starting group setup..."

    ActiveRecord::Base.transaction do
      # Create the new group
      admin = User.first # Using first user as admin, modify as needed
      group = Group.create!(
        name: "Hoot (Beta Testers)",
        created_by: admin
      )
      puts "Created group: #{group.name}"

      # Add all users to the group
      User.find_each do |user|
        group.add_user(user, user == admin ? :admin : :member)
      end
      puts "Added #{User.count} users to the group"

      # Move all prompt questions to the group
      # Note: This assumes prompt questions without a group
      PromptQuestion.where(group_id: nil).find_each do |prompt|
        prompt.update!(group: group)
      end
      puts "Moved #{PromptQuestion.where(group_id: group.id).count} prompt questions to the group"

      # Associate all posts with the group
      # Note: This assumes posts without a group
      Post.where(group_id: nil).find_each do |post|
        post.update!(group: group)
      end
      puts "Associated #{Post.where(group_id: group.id).count} posts with the group"

      puts "\nGroup setup completed successfully!"
      puts "Group ID: #{group.id}"
      puts "Group Name: #{group.name}"
      puts "Admin: #{admin.username}"
    end
  end
end
